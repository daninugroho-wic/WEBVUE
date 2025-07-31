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
        <h1 class="text-4xl font-bold text-gray-800 mb-2">Buat Laporan Customer</h1>
        <p class="text-lg text-gray-600">Masukkan informasi laporan customer baru</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-start mb-8">
        <router-link to="/helpdesks">
          <button
            class="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition duration-300 shadow-md flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </button>
        </router-link>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <div class="flex">
          <svg class="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd" />
          </svg>
          <div>
            <strong>Error:</strong> {{ errorMessage }}
          </div>
        </div>
      </div>

      <!-- Form Container -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Informasi Laporan</h3>
          <p class="text-sm text-gray-600 mt-1">Lengkapi semua field yang diperlukan</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Nama Customer -->
            <div>
              <label for="namaCustomer" class="block text-sm font-medium text-gray-700 mb-2">Nama Customer</label>
              <input id="namaCustomer" v-model="namaCustomer" type="text" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                placeholder="Masukkan nama customer" />
            </div>

            <!-- No. Telephone -->
            <div>
              <label for="noTelephone" class="block text-sm font-medium text-gray-700 mb-2">No. Telephone</label>
              <input id="noTelephone" v-model="noTelephone" type="text" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                placeholder="Masukkan no. telephone" />
            </div>

            <!-- Lokasi -->
            <div>
              <label for="lokasi" class="block text-sm font-medium text-gray-700 mb-2">Lokasi</label>
              <input id="lokasi" v-model="lokasi" type="text" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                placeholder="Masukkan lokasi" />
            </div>

            <!-- Platform -->
            <div>
              <label for="platform" class="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select id="platform" v-model="platform" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200">
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <!-- Team -->
            <div>
              <label for="team" class="block text-sm font-medium text-gray-700 mb-2">Team</label>
              <select id="team" v-model="team" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200">
                <option value="">Pilih Team</option>
                <option value="NOC">NOC</option>
                <option value="FINANCE">FINANCE</option>
              </select>
            </div>

            <!-- Status -->
            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select id="status" v-model="status" required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200">
                <option value="progress">Progress</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
          </div>

          <!-- Laporan Customer (Full Width) -->
          <div class="mt-6">
            <label for="laporanCustomer" class="block text-sm font-medium text-gray-700 mb-2">Laporan Customer</label>
            <textarea id="laporanCustomer" v-model="laporanCustomer" required rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none"
              placeholder="Masukkan detail laporan customer..."></textarea>
          </div>

          <!-- Submit Button -->
          <div class="mt-8 flex justify-end space-x-4">
            <router-link to="/helpdesks">
              <button type="button"
                class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200">
                Batal
              </button>
            </router-link>
            <button type="submit" :disabled="loading"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-200 flex items-center">
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ loading ? 'Menyimpan...' : 'Simpan Laporan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import Sidebar from "@/components/SidebarHelpdesks.vue"

const router = useRouter();
const sidebarOpen = ref(false);

// Form data
const namaCustomer = ref('');
const noTelephone = ref('');
const laporanCustomer = ref('');
const lokasi = ref('');
const platform = ref('whatsapp');
const team = ref('');
const status = ref('progress');
const loading = ref(false);
const errorMessage = ref('');

// Methods
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

const handleSubmit = async () => {
  if (!namaCustomer.value || !noTelephone.value || !laporanCustomer.value || !lokasi.value || !team.value) {
    errorMessage.value = 'Semua kolom wajib diisi!';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const laporanData = {
      namaCustomer: namaCustomer.value,
      noTelephone: noTelephone.value,
      laporanCustomer: laporanCustomer.value,
      lokasi: lokasi.value,
      platform: platform.value,
      team: team.value,
      // status: status.value,
    };

    // Kirim data ke backend
    await axios.post('http://localhost:3000/api/laporan', laporanData);

    // Reset form setelah submit
    namaCustomer.value = '';
    noTelephone.value = '';
    laporanCustomer.value = '';
    lokasi.value = '';
    platform.value = 'whatsapp';
    team.value = '';
    // status.value = 'progress';

    // Show success message and redirect
    alert('Laporan berhasil disimpan!');
    router.push('/helpdesks');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Gagal mengirim laporan';
  } finally {
    loading.value = false;
  }
};
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