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
  <Sidebar />

  <!-- Main content -->
  <div class="sm:ml-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
    <!-- Header -->
    <div class="pt-16 sm:pt-8 px-6">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Daftar Laporan Customer</h1>
        <p class="text-lg text-gray-600">Kelola dan monitor semua laporan dari customer</p>
        <div class="mt-4 text-sm text-gray-500">
          <span>Total laporan: {{ laporanList.length }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between items-center mb-8">
        <router-link to="/helpdesks">
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

      <!-- Laporan Table -->
      <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-800">Data Laporan Customer</h3>
          <p class="text-sm text-gray-600 mt-1">Kelola semua laporan yang masuk dari customer</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Telephone</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laporan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(laporan, idx) in laporanList" :key="laporan._id"
                class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ idx + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ laporan.namaCustomer }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ laporan.noTelephone }}
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
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
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
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ laporan.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button @click="editLaporan(laporan._id)"
                      class="text-indigo-600 hover:text-indigo-900 transition-colors duration-200 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button @click="deleteLaporan(laporan._id)"
                      class="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="laporanList.length === 0 && !loading">
                <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                  <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-lg font-medium text-gray-900 mb-2">Belum ada data laporan</p>
                  <p class="text-sm text-gray-500">Laporan customer akan muncul di sini</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Sidebar from "@/components/SidebarHelpdesks.vue"

const router = useRouter();
const sidebarOpen = ref(false);
const laporanList = ref([]);
const loading = ref(false);
const error = ref('');

// Methods
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function getPlatformBadgeClass(platform) {
  switch (platform) {
    case 'whatsapp':
      return 'bg-green-100 text-green-800';
    case 'instagram':
      return 'bg-pink-100 text-pink-800';
    case 'telegram':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getTeamBadgeClass(team) {
  switch (team) {
    case 'NOC':
      return 'bg-yellow-100 text-yellow-800';
    case 'FINANCE':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'selesai':
      return 'bg-green-100 text-green-800';
    case 'progress':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

async function fetchLaporans() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get('http://localhost:3000/api/laporan');
    laporanList.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.error || 'Gagal mengambil data laporan';
    console.error('Error fetching laporans:', err);
  } finally {
    loading.value = false;
  }
}

function editLaporan(id) {
  router.push(`/laporans/edit/${id}`);
}

async function deleteLaporan(id) {
  if (confirm('Yakin ingin menghapus laporan ini?')) {
    try {
      await axios.delete(`http://localhost:3000/api/laporan/${id}`);
      laporanList.value = laporanList.value.filter(l => l._id !== id);
      alert('Laporan berhasil dihapus');
    } catch (err) {
      alert('Gagal menghapus laporan');
      console.error('Error deleting laporan:', err);
    }
  }
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
</style>