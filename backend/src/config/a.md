const { IgApiClient } = require('instagram-private-api');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ==================== GLOBAL VARIABLES ====================
let ig = null;
let loggedIn = false;
let currentUsername = null;
let dmListenerInterval = null;

// Enhanced: Track processed messages dengan error handling
const processedMessages = new Map(); // threadId -> lastMessageTimestamp
const errorCount = { consecutive: 0, total: 0, lastErrorTime: null };
const MAX_CONSECUTIVE_ERRORS = 5;
const ERROR_COOLDOWN_TIME = 60000; // 1 minute

// ==================== ERROR HANDLING UTILITIES ====================

/**
 * Circuit breaker untuk Instagram API calls
 */
class InstagramCircuitBreaker {
    constructor() {
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureThreshold = 3;
        this.timeout = 30000; // 30 seconds
        this.failureCount = 0;
        this.lastFailureTime = null;
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
                console.log('🔄 Circuit breaker: Attempting recovery (HALF_OPEN)');
            } else {
                throw new Error('Circuit breaker is OPEN - Instagram API temporarily unavailable');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
        errorCount.consecutive = 0;
        console.log('✅ Circuit breaker: Service recovered (CLOSED)');
    }

    onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        errorCount.consecutive++;
        errorCount.total++;
        errorCount.lastErrorTime = Date.now();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.log('🚫 Circuit breaker: Service unavailable (OPEN)');
        }

        console.error(`❌ Instagram API Error (${this.failureCount}/${this.failureThreshold}):`, error.message);
    }
}

const circuitBreaker = new InstagramCircuitBreaker();

/**
 * Enhanced error handler untuk Instagram API
 */
function handleInstagramError(error, context = '') {
    const errorInfo = {
        name: error.name,
        message: error.message,
        context,
        timestamp: new Date().toISOString()
    };

    // Log specific error types
    if (error.name === 'IgNotFoundError') {
        console.error('🔍 Instagram API Endpoint Not Found:', {
            ...errorInfo,
            suggestion: 'API endpoint may have changed or account restricted'
        });
    } else if (error.name === 'IgLoginRequiredError') {
        console.error('🔐 Instagram Login Required:', {
            ...errorInfo,
            suggestion: 'Session expired, need re-authentication'
        });
    } else if (error.name === 'IgCheckpointError') {
        console.error('🛡️ Instagram Challenge Required:', {
            ...errorInfo,
            suggestion: 'Account needs verification'
        });
    } else if (error.name === 'IgActionBlockedError') {
        console.error('🚫 Instagram Action Blocked:', {
            ...errorInfo,
            suggestion: 'Rate limited or suspicious activity detected'
        });
    } else {
        console.error('❌ Instagram Unknown Error:', errorInfo);
    }

    return errorInfo;
}

// ==================== MESSAGE HANDLERS ====================

/**
 * Enhanced DM handler dengan comprehensive error handling
 */
async function handleIncomingDM(thread) {
    try {
        if (!thread?.last_permanent_item?.text) return;

        const threadId = thread.thread_id;
        const senderId = thread.users?.[0]?.pk?.toString();
        const senderName = thread.users?.[0]?.username || senderId;
        const messageText = thread.last_permanent_item.text;
        const messageTimestamp = thread.last_permanent_item.timestamp;

        // Validation
        if (!senderId || !messageText || !messageTimestamp) {
            console.log('⚠️ Invalid message data, skipping...');
            return;
        }

        // Skip if message already processed
        const lastProcessedTimestamp = processedMessages.get(threadId);
        if (lastProcessedTimestamp && messageTimestamp <= lastProcessedTimestamp) {
            return;
        }

        // Skip if message from self
        if (senderId === currentUsername || thread.last_permanent_item.user_id?.toString() === currentUsername) {
            processedMessages.set(threadId, messageTimestamp);
            return;
        }

        console.log('📨 Instagram DM received:', {
            from: senderName,
            preview: messageText.slice(0, 50) + '...',
            timestamp: new Date(messageTimestamp * 1000).toISOString()
        });

        // Update processed messages tracker
        processedMessages.set(threadId, messageTimestamp);

        // Check for duplicate message in database
        const existingMessage = await Message.findOne({
            platform: 'instagram',
            sender_id: senderId,
            text: messageText,
            createdAt: { $gte: new Date(Date.now() - 60000) }
        });

        if (existingMessage) {
            console.log('⚠️ Duplicate message detected, skipping...');
            return;
        }

        // Find or create conversation
        let conversation = await findOrCreateConversation(senderId, senderName, messageText);

        // Save message to database
        const newMessage = new Message({
            platform: 'instagram',
            conversation_id: conversation._id,
            sender_id: senderId,
            receiver_id: currentUsername,
            text: messageText,
            status: 'received',
            instagram_thread_id: threadId,
            instagram_message_timestamp: messageTimestamp
        });

        await newMessage.save();

        console.log('✅ Instagram message saved to database');

        // Emit real-time update
        emitInstagramMessage('new-instagram-message', {
            conversation_id: conversation._id,
            message_id: newMessage._id,
            sender_id: senderId,
            sender_name: senderName,
            text: messageText,
            timestamp: newMessage.createdAt,
            platform: 'instagram'
        });

    } catch (error) {
        handleInstagramError(error, 'handleIncomingDM');
    }
}

/**
 * Enhanced send DM dengan retry mechanism
 */
async function sendInstagramDM(userId, messageText, retries = 2) {
    try {
        if (!loggedIn || !ig) {
            throw new Error('Instagram not logged in');
        }

        console.log('📤 Sending Instagram DM:', {
            to: userId,
            messageLength: messageText.length,
            retries
        });

        // Send DM with circuit breaker
        const result = await circuitBreaker.execute(async () => {
            const userPk = typeof userId === 'string' ? userId : userId.toString();
            const thread = ig.entity.directThread([userPk]);
            return await thread.broadcastText(messageText);
        });

        // Find or create conversation
        let conversation = await findOrCreateConversation(userId, userId, messageText);

        // Save sent message
        const newMessage = new Message({
            platform: 'instagram',
            conversation_id: conversation._id,
            sender_id: currentUsername,
            receiver_id: userId,
            text: messageText,
            status: 'sent'
        });

        await newMessage.save();

        // Update conversation
        conversation.last_message = messageText;
        conversation.last_message_time = new Date();
        await conversation.save();

        console.log('✅ Instagram DM sent and saved');

        // Emit real-time update
        emitInstagramMessage('instagram-message-sent', {
            conversation_id: conversation._id,
            message_id: newMessage._id,
            sender_id: currentUsername,
            receiver_id: userId,
            text: messageText,
            timestamp: newMessage.createdAt,
            platform: 'instagram'
        });

        return { success: true, message_id: newMessage._id };

    } catch (error) {
        handleInstagramError(error, 'sendInstagramDM');

        // Retry mechanism
        if (retries > 0 && (error.name === 'IgNotFoundError' || error.name === 'IgNetworkError')) {
            console.log(`🔄 Retrying send DM (${retries} attempts left)...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await sendInstagramDM(userId, messageText, retries - 1);
        }

        return { success: false, error: error.message };
    }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Find or create conversation dengan error handling
 */
async function findOrCreateConversation(contactId, contactName, lastMessage) {
    try {
        let conversation = await Conversation.findOne({
            platform: 'instagram',
            contact_id: contactId
        });

        if (!conversation) {
            conversation = new Conversation({
                platform: 'instagram',
                contact_id: contactId,
                contact_name: contactName,
                instagram_id: contactId,
                last_message: lastMessage,
                last_message_time: new Date()
            });
            console.log('✅ New Instagram conversation created');
        } else {
            conversation.contact_name = contactName;
            conversation.last_message = lastMessage;
            conversation.last_message_time = new Date();
        }

        await conversation.save();
        return conversation;

    } catch (error) {
        handleInstagramError(error, 'findOrCreateConversation');
        throw error;
    }
}

/**
 * Emit real-time message dengan error handling
 */
function emitInstagramMessage(event, data) {
    try {
        if (global.io) {
            global.io.emit(event, data);
            console.log(`📡 Real-time event emitted: ${event}`);
        }
    } catch (error) {
        console.error('❌ Error emitting real-time event:', error.message);
    }
}

// ==================== LOGIN & AUTHENTICATION ====================

const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

/**
 * Enhanced login dengan comprehensive error handling
 */
async function loginInstagram(username = IG_USERNAME, password = IG_PASSWORD) {
    try {
        console.log('🔄 Instagram login attempt:', username);

        // Initialize Instagram API client
        ig = new IgApiClient();
        ig.state.generateDevice(username);

        // Login with circuit breaker
        await circuitBreaker.execute(async () => {
            return await ig.account.login(username, password);
        });

        loggedIn = true;
        currentUsername = username;

        console.log('✅ Instagram login successful');

        // Clear processed messages on re-login
        processedMessages.clear();
        
        // Reset error counters
        errorCount.consecutive = 0;

        // Start monitoring DMs
        startDMListener();

        return { success: true };

    } catch (error) {
        loggedIn = false;
        handleInstagramError(error, 'loginInstagram');

        // Handle specific error types
        if (error.name === 'IgCheckpointError') {
            console.log('🔐 Instagram Challenge Required');
            return {
                success: false,
                challenge: true,
                challengeData: error.response?.body?.challenge
            };
        }

        throw error;
    }
}

// ==================== DM MONITORING ====================

/**
 * Enhanced DM listener dengan robust error handling
 */
function startDMListener() {
    if (!loggedIn) {
        console.log('⚠️ Cannot start DM listener: not logged in');
        return;
    }

    if (dmListenerInterval) {
        clearInterval(dmListenerInterval);
    }

    console.log('🔄 Starting Instagram DM monitoring...');

    // Initialize processed messages
    initializeProcessedMessages();

    dmListenerInterval = setInterval(async () => {
        // Skip if too many consecutive errors
        if (errorCount.consecutive >= MAX_CONSECUTIVE_ERRORS) {
            const timeSinceError = Date.now() - errorCount.lastErrorTime;
            if (timeSinceError < ERROR_COOLDOWN_TIME) {
                console.log('⏳ Too many errors, cooling down...');
                return;
            } else {
                console.log('🔄 Cooldown period over, resuming checks...');
                errorCount.consecutive = 0;
            }
        }

        await checkInstagramDMs();
    }, 15000); // 15 second intervals
}

/**
 * Enhanced DM checking dengan comprehensive error handling
 */
async function checkInstagramDMs() {
    try {
        if (!loggedIn || !ig) {
            console.log('⚠️ Instagram not ready for DM check');
            return;
        }

        console.log('📬 Checking Instagram DMs...');

        // Get inbox with circuit breaker
        const inbox = await circuitBreaker.execute(async () => {
            const feed = ig.feed.directInbox();
            return await feed.items();
        });

        if (!inbox || inbox.length === 0) {
            console.log('📭 No conversations found');
            return;
        }

        console.log(`📨 Processing ${inbox.length} conversations`);

        // Process each thread
        for (const thread of inbox) {
            await handleIncomingDM(thread);
        }

        console.log('✅ DM check completed successfully');

    } catch (error) {
        const errorInfo = handleInstagramError(error, 'checkInstagramDMs');

        // Handle specific errors
        if (error.name === 'IgCheckpointError') {
            console.log('🔐 Challenge required during DM check');
            // Stop listener until re-authentication
            if (dmListenerInterval) {
                clearInterval(dmListenerInterval);
                dmListenerInterval = null;
            }
        } else if (error.name === 'IgLoginRequiredError') {
            console.log('🔑 Login required, stopping DM listener');
            loggedIn = false;
            if (dmListenerInterval) {
                clearInterval(dmListenerInterval);
                dmListenerInterval = null;
            }
        }
        // For other errors, continue with circuit breaker logic
    }
}

/**
 * Enhanced initialization dengan fallback
 */
async function initializeProcessedMessages() {
    try {
        console.log('🔄 Initializing processed messages...');

        const inbox = await circuitBreaker.execute(async () => {
            const feed = ig.feed.directInbox();
            return await feed.items();
        });

        let initializedCount = 0;
        for (const thread of inbox) {
            if (thread?.last_permanent_item?.timestamp) {
                processedMessages.set(thread.thread_id, thread.last_permanent_item.timestamp);
                initializedCount++;
            }
        }

        console.log(`✅ Initialized ${initializedCount} processed message timestamps`);

    } catch (error) {
        handleInstagramError(error, 'initializeProcessedMessages');

        // Fallback: Load from database
        console.log('🔄 Using fallback initialization from database...');
        try {
            const recentMessages = await Message.find({
                platform: 'instagram',
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }).select('instagram_thread_id instagram_message_timestamp');

            let fallbackCount = 0;
            for (const msg of recentMessages) {
                if (msg.instagram_thread_id && msg.instagram_message_timestamp) {
                    const existing = processedMessages.get(msg.instagram_thread_id);
                    if (!existing || msg.instagram_message_timestamp > existing) {
                        processedMessages.set(msg.instagram_thread_id, msg.instagram_message_timestamp);
                        fallbackCount++;
                    }
                }
            }

            console.log(`✅ Fallback: Loaded ${fallbackCount} processed messages from database`);

        } catch (dbError) {
            console.error('❌ Fallback initialization failed:', dbError.message);
            console.log('⚠️ Starting with empty processed messages');
        }
    }
}

// ==================== STATUS & UTILITY ====================

/**
 * Enhanced status dengan comprehensive information
 */
function getInstagramStatus() {
    return {
        isLoggedIn: loggedIn,
        username: currentUsername,
        isReady: ig !== null && loggedIn,
        processedThreads: processedMessages.size,
        circuitBreakerState: circuitBreaker.state,
        errorStats: {
            consecutive: errorCount.consecutive,
            total: errorCount.total,
            lastErrorTime: errorCount.lastErrorTime
        },
        monitoring: dmListenerInterval !== null,
        timestamp: new Date().toISOString()
    };
}

/**
 * Enhanced logout dengan cleanup
 */
function logoutInstagram() {
    console.log('🛑 Instagram logout initiated');
    
    loggedIn = false;
    currentUsername = null;
    ig = null;

    // Clear intervals
    if (dmListenerInterval) {
        clearInterval(dmListenerInterval);
        dmListenerInterval = null;
    }

    // Clear processed messages
    processedMessages.clear();

    // Reset error counters
    errorCount.consecutive = 0;
    errorCount.total = 0;
    errorCount.lastErrorTime = null;

    // Reset circuit breaker
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failureCount = 0;

    console.log('✅ Instagram logout completed');
}

// ==================== EXPORTS ====================
module.exports = {
    loginInstagram,
    sendInstagramDM,
    getInstagramStatus,
    logoutInstagram,
    startDMListener,
    
    // Additional exports for monitoring
    getErrorStats: () => errorCount,
    getCircuitBreakerState: () => circuitBreaker.state,
    resetErrorCounters: () => {
        errorCount.consecutive = 0;
        errorCount.total = 0;
        errorCount.lastErrorTime = null;
    }
};