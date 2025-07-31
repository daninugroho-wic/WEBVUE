require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");

// Import configurations and services
const connectDB = require("./src/config/database");
const initializeSocket = require("./src/config/socket");
const initializeServices = require("./src/config/services");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const laporanRoutes = require("./src/routes/laporanRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const teleRoutes = require("./src/routes/teleRoutes"); // Pastikan ini ada

// Inisialisasi app & server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize socket
const io = initializeSocket(server);
app.set('io', io); // Set io ke app agar bisa diakses di controller

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/telegram", teleRoutes); // Route telegram
app.use("/", chatRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    routes: {
      auth: '/api/auth',
      laporan: '/api/laporan', 
      telegram: '/api/telegram',
      chat: '/'
    }
  });
});

// Connect to database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📱 Telegram API: http://localhost:${PORT}/api/telegram`);
    
    // Initialize services after server starts
    console.log('🚀 Initializing external services...');
    try {
      initializeServices();
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
    }
  });
}).catch((error) => {
  console.error("❌ Failed to connect to database:", error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});