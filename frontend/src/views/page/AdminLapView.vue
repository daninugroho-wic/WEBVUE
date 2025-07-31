<template>
  <!-- Overlay ketika sidebar mobile aktif -->
  <transition name="fade">
    <div v-if="sidebarOpen" @click="toggleSidebar" class="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"></div>
  </transition>

  <!-- Toggle button untuk mobile -->
  <button @click="toggleSidebar" :aria-expanded="sidebarOpen.toString()" aria-controls="logo-sidebar" type="button"
    class="fixed top-4 left-4 z-40 inline-flex items-center p-2 text-gray-600 rounded-md bg-white shadow-md sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
    <span class="sr-only">Open sidebar</span>
    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  <!-- Sidebar -->
  <SidebarAdmin />

  <!-- Main content -->
  <div class="sm:ml-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
    <!-- Header -->
    <div class="pt-16 sm:pt-8 px-6">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Laporan Admin</h1>
        <p class="text-lg text-gray-600">Monitoring laporan customer dari seluruh team</p>
        <div class="mt-4 text-sm text-gray-500">
          <span>Total laporan: {{ laporanList.length }} | Progress: {{ getStatusCount('progress') }} | Selesai: {{
            getStatusCount('selesai') }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-4 mb-8">
        <router-link to="/admins">
          <button
            class="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-300 shadow-md flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </router-link>


      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        <span class="ml-4 text-lg text-gray-600">Memuat data laporan...</span>
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
            <button @click="fetchLaporans" class="ml-4 text-red-800 underline hover:text-red-900">
              Coba lagi
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="space-y-8">
        <!-- Filter Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 no-print">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Filter Laporan</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select v-model="filters.platform" @change="applyFilters"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Semua Platform</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="filters.status" @change="applyFilters"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Semua Status</option>
                <option value="progress">Progress</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select v-model="filters.team" @change="applyFilters"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Semua Team</option>
                <option v-for="team in uniqueTeams" :key="team" :value="team">{{ team }}</option>
              </select>
            </div>
            <div class="flex items-end">
              <button @click="clearFilters"
                class="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300">
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        <!-- Laporan Table -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden print-area">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">Daftar Laporan</h3>
            <p class="text-sm text-gray-600 mt-1">Monitoring semua laporan customer</p>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer
                    Info</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laporan
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <!-- Data Rows -->
                <tr v-for="(laporan, idx) in filteredLaporans" :key="laporan._id"
                  class="hover:bg-gray-50 transition-colors duration-200">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ idx + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ laporan.namaCustomer }}</div>
                        <div class="text-sm text-gray-500">{{ laporan.noTelephone }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div class="truncate" :title="laporan.laporanCustomer">
                      {{ laporan.laporanCustomer }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ laporan.lokasi }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getPlatformBadgeClass(laporan.platform)"
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize">
                      {{ laporan.platform }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getTeamBadgeClass(laporan.team)"
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {{ laporan.team }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getStatusBadgeClass(laporan.status)"
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize">
                      {{ laporan.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(laporan.createdAt) }}
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="filteredLaporans.length === 0">
                  <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="text-lg font-medium text-gray-900 mb-2">
                      {{ laporanList.length === 0 ? 'Belum ada data laporan' : 'Tidak ada data yang sesuai dengan filter' }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ laporanList.length === 0 ? 'Data laporan akan muncul di sini setelah ada yang mengirim laporan'
                        : 'Coba ubah filter untuk melihat data lainnya' }}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Export Actions -->
        <div class="bg-white rounded-xl shadow-lg p-6 no-print">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Export & Actions</h3>
          <div class="flex flex-wrap gap-4">
            <button @click="exportToCSV"
              class="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 shadow-md">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button @click="printReport"
              class="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import SidebarAdmin from '@/components/SidebarAdmins.vue'

const router = useRouter();
const sidebarOpen = ref(false);
const laporanList = ref([]);
const filteredLaporans = ref([]);
const loading = ref(false);
const error = ref('');
const filters = ref({
  platform: '',
  status: '',
  team: ''
});

// Computed
const uniqueTeams = computed(() => {
  const teams = laporanList.value.map(laporan => laporan.team).filter(Boolean);
  return [...new Set(teams)].sort();
});

// Methods
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusCount(status) {
  return laporanList.value.filter(laporan => laporan.status === status).length;
}

function getPlatformBadgeClass(platform) {
  switch (platform) {
    case 'whatsapp': return 'bg-green-100 text-green-800';
    case 'telegram': return 'bg-blue-100 text-blue-800';
    case 'instagram': return 'bg-pink-100 text-pink-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getTeamBadgeClass(team) {
  switch (team) {
    case 'NOC': return 'bg-yellow-100 text-yellow-800';
    case 'FINANCE': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'progress': return 'bg-yellow-100 text-yellow-800';
    case 'selesai': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

async function fetchLaporans() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get('http://localhost:3000/api/laporan');
    laporanList.value = res.data;
    filteredLaporans.value = res.data;
    console.log('Data laporan berhasil dimuat:', res.data);
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal mengambil data laporan';
    console.error('Error fetching laporans:', err);
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  filteredLaporans.value = laporanList.value.filter(laporan => {
    const platformMatch = !filters.value.platform || laporan.platform === filters.value.platform;
    const statusMatch = !filters.value.status || laporan.status === filters.value.status;
    const teamMatch = !filters.value.team || laporan.team === filters.value.team;

    return platformMatch && statusMatch && teamMatch;
  });
}

function clearFilters() {
  filters.value = {
    platform: '',
    status: '',
    team: ''
  };
  filteredLaporans.value = laporanList.value;
}

function exportToCSV() {
  const headers = ['No', 'Nama Customer', 'No. Telephone', 'Laporan Customer', 'Lokasi', 'Platform', 'Team', 'Status', 'Tanggal'];
  const csvContent = [
    headers.join(','),
    ...filteredLaporans.value.map((laporan, index) => [
      index + 1,
      `"${laporan.namaCustomer}"`,
      `"${laporan.noTelephone}"`,
      `"${laporan.laporanCustomer}"`,
      `"${laporan.lokasi}"`,
      `"${laporan.platform}"`,
      `"${laporan.team}"`,
      `"${laporan.status}"`,
      `"${formatDate(laporan.createdAt)}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `laporan_admin_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printReport() {
  window.print();
}

// Lifecycle
onMounted(() => {
  fetchLaporans();
});
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

@media print {
  .no-print {
    display: none !important;
  }
  .print-area {
    display: block !important;
    box-shadow: none !important;
    background: white !important;
  }
  body *:not(.print-area):not(.print-area *) {
    visibility: hidden !important;
  }
  .print-area, .print-area * {
    visibility: visible !important;
  }
  .print-area {
    position: absolute !important;
    left: 0; top: 0; width: 100vw;
    margin: 0; padding: 0;
  }
}
</style>