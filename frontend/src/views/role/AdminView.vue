<template>
    <!-- Sidebar Component -->
    <SidebarAdmin />

    <!-- Main content -->
    <div class="sm:ml-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
        <!-- Header -->
        <div class="pt-16 sm:pt-8 px-6">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Dashboard Admin</h1>
                <p class="text-lg text-gray-600">Monitoring sistem dan manajemen user</p>
                <div class="mt-4 text-sm text-gray-500">
                    <span>Last updated: {{ formatDate(new Date()) }}</span>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                <span class="ml-4 text-lg text-gray-600">Memuat data...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <div class="flex">
                    <svg class="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd" />
                    </svg>
                    <div>
                        <strong>Error:</strong> {{ error }}
                        <button @click="loadData" class="ml-4 text-red-800 underline hover:text-red-900">
                            Coba lagi
                        </button>
                    </div>
                </div>
            </div>

            <!-- Dashboard Content -->
            <div v-else class="space-y-8">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Total Users -->
                    <div
                        class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Users</p>
                                <p class="text-3xl font-bold text-gray-900">{{ dashboardData.totalUsers }}</p>
                                <p class="text-sm text-blue-600 mt-1">
                                    <span class="font-medium">{{ dashboardData.activeUsers }}</span> aktif
                                </p>
                            </div>
                            <div class="p-3 bg-blue-100 rounded-full">
                                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Total Laporan -->
                    <div
                        class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Laporan</p>
                                <p class="text-3xl font-bold text-gray-900">{{ dashboardData.totalLaporan }}</p>
                                <p class="text-sm text-green-600 mt-1">
                                    <span class="font-medium">+{{ dashboardData.laporanBulanIni }}</span> bulan ini
                                </p>
                            </div>
                            <div class="p-3 bg-green-100 rounded-full">
                                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Team NOC -->
                    <div
                        class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Team NOC</p>
                                <p class="text-3xl font-bold text-gray-900">{{ dashboardData.teamNOC }}</p>
                                <p class="text-sm text-yellow-600 mt-1">
                                    <span class="font-medium">{{ dashboardData.nocProgress }}</span> dalam progress
                                </p>
                            </div>
                            <div class="p-3 bg-yellow-100 rounded-full">
                                <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Team Finance -->
                    <div
                        class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Team Finance</p>
                                <p class="text-3xl font-bold text-gray-900">{{ dashboardData.teamFinance }}</p>
                                <p class="text-sm text-purple-600 mt-1">
                                    <span class="font-medium">{{ dashboardData.financeProgress }}</span> dalam progress
                                </p>
                            </div>
                            <div class="p-3 bg-purple-100 rounded-full">
                                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Users & Reports Statistics -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- User Statistics -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Statistik User</h3>
                        <div class="space-y-4">
                            <div v-for="role in dashboardData.userRoles" :key="role.name"
                                class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <div :class="role.color" class="w-4 h-4 rounded-full mr-3"></div>
                                    <span class="text-gray-700">{{ role.name }}</span>
                                </div>
                                <div class="flex items-center">
                                    <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                        <div :class="role.color" class="h-2 rounded-full"
                                            :style="`width: ${role.percentage}%`"></div>
                                    </div>
                                    <span class="text-sm font-medium text-gray-600">{{ role.count }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activities -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h3>
                        <div class="space-y-3">
                            <div v-for="login in dashboardData.loginHistory" :key="login.id"
                                class="flex items-start space-x-3">
                                <div class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-gray-900 truncate">{{ login.username }}</p>
                                    <p class="text-xs text-gray-500">{{ login.role }} • {{
                                        formatLoginDate(login.loginTime) }}</p>
                                </div>
                                <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                    Login
                                </span>
                            </div>
                            <div v-if="dashboardData.loginHistory.length === 0" class="text-center py-4">
                                <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p class="text-sm text-gray-500">Belum ada riwayat login</p>
                            </div>
                        </div>
                        <div class="mt-4 pt-4 border-t border-gray-200">
                            <router-link to="/akses" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                Lihat semua user →
                            </router-link>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <router-link to="/register"
                            class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200">
                            <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            <div>
                                <p class="font-medium text-gray-700">Tambah User Baru</p>
                                <p class="text-sm text-gray-500">Buat akun helpdesk</p>
                            </div>
                        </router-link>

                        <button @click="refreshData"
                            class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200">
                            <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <div>
                                <p class="font-medium text-gray-700">Refresh Data</p>
                                <p class="text-sm text-gray-500">Update statistik terbaru</p>
                            </div>
                        </button>

                        <router-link to="/laporan"
                            class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200">
                            <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div>
                                <p class="font-medium text-gray-700">Lihat Laporan</p>
                                <p class="text-sm text-gray-500">Monitor semua laporan</p>
                            </div>
                        </router-link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SidebarAdmin from '@/components/SidebarAdmins.vue'

const router = useRouter()
const loading = ref(true)
const error = ref('')

// Dashboard data
const dashboardData = ref({
    totalUsers: 0,
    activeUsers: 0,
    totalLaporan: 0,
    laporanBulanIni: 0,
    teamNOC: 0,
    teamFinance: 0,
    nocProgress: 0,
    financeProgress: 0,
    laporanSelesai: 0,
    laporanProgress: 0,
    persentaseSelesai: 0,
    userRoles: [
        { name: 'Admin', count: 0, percentage: 0, color: 'bg-indigo-500' },
        { name: 'Helpdesk', count: 0, percentage: 0, color: 'bg-green-500' }
    ],
    platforms: [
        { name: 'WhatsApp', count: 0, percentage: 0, color: 'bg-green-500' },
        { name: 'Instagram', count: 0, percentage: 0, color: 'bg-pink-500' },
        { name: 'Telegram', count: 0, percentage: 0, color: 'bg-blue-500' }
    ],
    loginHistory: []
})

function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function formatLoginDate(date) {
    const now = new Date()
    const loginDate = new Date(date)
    const diffInMinutes = Math.floor((now - loginDate) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) {
        return 'Baru saja'
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} menit yang lalu`
    } else if (diffInHours < 24) {
        return `${diffInHours} jam yang lalu`
    } else if (diffInDays === 1) {
        return 'Kemarin'
    } else if (diffInDays < 7) {
        return `${diffInDays} hari yang lalu`
    } else {
        return loginDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: loginDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        })
    }
}

async function loadData() {
    try {
        loading.value = true
        error.value = ''

        // Fetch users data
        const usersResponse = await axios.get('http://localhost:3000/api/auth/users')
        const users = usersResponse.data

        // Fetch laporan data
        const laporanResponse = await axios.get('http://localhost:3000/api/laporan')
        const laporans = laporanResponse.data

        // Fetch login history
        try {
            const loginHistoryResponse = await axios.get('http://localhost:3000/api/auth/login-history')
            dashboardData.value.loginHistory = loginHistoryResponse.data
                .sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime))
                .slice(0, 5)
                .map(login => ({
                    id: login._id,
                    username: login.username,
                    role: login.role,
                    loginTime: login.loginTime
                }))
        } catch (loginErr) {
            console.warn('Login history endpoint not available:', loginErr)
            dashboardData.value.loginHistory = []
        }

        // Calculate user statistics
        dashboardData.value.totalUsers = users.length
        dashboardData.value.activeUsers = users.filter(user => user.status === 'On').length

        // User role statistics
        const adminCount = users.filter(user => user.role === 'admin').length
        const helpdeskCount = users.filter(user => user.role === 'helpdesk').length
        const maxUserCount = Math.max(adminCount, helpdeskCount)

        dashboardData.value.userRoles[0].count = adminCount
        dashboardData.value.userRoles[0].percentage = maxUserCount > 0 ? (adminCount / maxUserCount) * 100 : 0

        dashboardData.value.userRoles[1].count = helpdeskCount
        dashboardData.value.userRoles[1].percentage = maxUserCount > 0 ? (helpdeskCount / maxUserCount) * 100 : 0

        // Calculate laporan statistics
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        // Total laporan
        dashboardData.value.totalLaporan = laporans.length

        // Laporan bulan ini
        dashboardData.value.laporanBulanIni = laporans.filter(laporan => {
            const laporanDate = new Date(laporan.createdAt)
            return laporanDate.getMonth() === currentMonth && laporanDate.getFullYear() === currentYear
        }).length

        // Team statistics
        dashboardData.value.teamNOC = laporans.filter(laporan => laporan.team === 'NOC').length
        dashboardData.value.teamFinance = laporans.filter(laporan => laporan.team === 'FINANCE').length

        // Progress statistics
        dashboardData.value.nocProgress = laporans.filter(laporan =>
            laporan.team === 'NOC' && laporan.status === 'progress'
        ).length
        dashboardData.value.financeProgress = laporans.filter(laporan =>
            laporan.team === 'FINANCE' && laporan.status === 'progress'
        ).length

        // Completed and progress reports
        dashboardData.value.laporanSelesai = laporans.filter(laporan => laporan.status === 'solved').length
        dashboardData.value.laporanProgress = laporans.filter(laporan => laporan.status === 'progress').length
        dashboardData.value.persentaseSelesai = dashboardData.value.totalLaporan > 0
            ? Math.round((dashboardData.value.laporanSelesai / dashboardData.value.totalLaporan) * 100)
            : 0

        // Platform statistics
        const whatsappCount = laporans.filter(laporan => laporan.platform === 'whatsapp').length
        const instagramCount = laporans.filter(laporan => laporan.platform === 'instagram').length
        const telegramCount = laporans.filter(laporan => laporan.platform === 'telegram').length

        const maxCount = Math.max(whatsappCount, instagramCount, telegramCount)

        dashboardData.value.platforms[0].count = whatsappCount
        dashboardData.value.platforms[0].percentage = maxCount > 0 ? (whatsappCount / maxCount) * 100 : 0

        dashboardData.value.platforms[1].count = instagramCount
        dashboardData.value.platforms[1].percentage = maxCount > 0 ? (instagramCount / maxCount) * 100 : 0

        dashboardData.value.platforms[2].count = telegramCount
        dashboardData.value.platforms[2].percentage = maxCount > 0 ? (telegramCount / maxCount) * 100 : 0

    } catch (err) {
        console.error('Error loading dashboard data:', err)
        error.value = err.response?.data?.error || 'Gagal memuat data dashboard'
    } finally {
        loading.value = false
    }
}

async function refreshData() {
    await loadData()
}

// Lifecycle
onMounted(() => {
    loadData()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>