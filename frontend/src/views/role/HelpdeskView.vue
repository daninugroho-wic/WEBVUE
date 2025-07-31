<template>
  <!-- Sidebar Component -->
  <Sidebar />

  <!-- Main content -->
  <div class="sm:ml-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
    <!-- Header -->
    <div class="pt-16 sm:pt-8 px-6">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Dashboard Helpdesk</h1>
        <p class="text-lg text-gray-600">Monitoring dan statistik laporan customer</p>
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Total Laporan -->
          <div
            class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Laporan</p>
                <p class="text-3xl font-bold text-gray-900">{{ dashboardData.totalLaporan }}</p>
                <p class="text-sm text-blue-600 mt-1">
                  <span class="font-medium">+{{ dashboardData.laporanBulanIni }}</span> bulan ini
                </p>
              </div>
              <div class="p-3 bg-blue-100 rounded-full">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Team Finance -->
          <div
            class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Team Finance</p>
                <p class="text-3xl font-bold text-gray-900">{{ dashboardData.teamFinance }}</p>
                <p class="text-sm text-green-600 mt-1">
                  <span class="font-medium">{{ dashboardData.financeProgress }}</span> dalam progress
                </p>
              </div>
              <div class="p-3 bg-green-100 rounded-full">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Platform Statistics -->
        <div class="grid grid-cols-1 gap-6">
          <!-- Recent Activities -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terbaru</h3>
            <div class="space-y-3">
              <div v-for="activity in dashboardData.recentActivities" :key="activity.id"
                class="flex items-start space-x-3">
                <div :class="activity.statusColor" class="w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900 truncate">{{ activity.customer }}</p>
                  <p class="text-xs text-gray-500">{{ activity.team }} • {{ formatDate(activity.date) }}</p>
                </div>
                <span :class="activity.badgeColor" class="px-2 py-1 text-xs rounded-full">
                  {{ activity.status }}
                </span>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-200">
              <router-link to="/laporans" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Lihat semua laporan →
              </router-link>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <router-link to="/form"
              class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200">
              <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div>
                <p class="font-medium text-gray-700">Buat Laporan Baru</p>
                <p class="text-sm text-gray-500">Tambah laporan customer</p>
              </div>
            </router-link>

            <button @click="refreshData"
              class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200">
              <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <p class="font-medium text-gray-700">Refresh Data</p>
                <p class="text-sm text-gray-500">Update statistik terbaru</p>
              </div>
            </button>

            <router-link to="/laporans"
              class="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200">
              <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div>
                <p class="font-medium text-gray-700">Kelola Laporan</p>
                <p class="text-sm text-gray-500">Edit & update status</p>
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
import axios from 'axios'
import Sidebar from '@/components/SidebarHelpdesks.vue'

const loading = ref(true)
const error = ref('')

// Dashboard data
const dashboardData = ref({
  totalLaporan: 0,
  laporanBulanIni: 0,
  teamNOC: 0,
  teamFinance: 0,
  nocProgress: 0,
  financeProgress: 0,
  laporanSelesai: 0,
  persentaseSelesai: 0,
  platforms: [
    { name: 'WhatsApp', count: 0, percentage: 0, color: 'bg-green-500' },
    { name: 'Instagram', count: 0, percentage: 0, color: 'bg-pink-500' },
    { name: 'Telegram', count: 0, percentage: 0, color: 'bg-blue-500' }
  ],
  recentActivities: []
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

async function loadData() {
  try {
    loading.value = true
    error.value = ''

    // Fetch laporan data
    const response = await axios.get('http://localhost:3000/api/laporan')
    const laporans = response.data

    // Calculate statistics
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

    // Completed reports
    dashboardData.value.laporanSelesai = laporans.filter(laporan => laporan.status === 'solved').length
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

    // Recent activities (last 5 reports)
    dashboardData.value.recentActivities = laporans
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(laporan => ({
        id: laporan._id,
        customer: laporan.namaCustomer,
        team: laporan.team,
        status: laporan.status,
        date: laporan.createdAt,
        statusColor: getStatusColor(laporan.status),
        badgeColor: getBadgeColor(laporan.status)
      }))

  } catch (err) {
    console.error('Error loading dashboard data:', err)
    error.value = err.response?.data?.error || 'Gagal memuat data dashboard'
  } finally {
    loading.value = false
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'solved': return 'bg-green-500'
    case 'progress': return 'bg-yellow-500'
    default: return 'bg-gray-500'
  }
}

function getBadgeColor(status) {
  switch (status) {
    case 'solved': return 'bg-green-100 text-green-800'
    case 'progress': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
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