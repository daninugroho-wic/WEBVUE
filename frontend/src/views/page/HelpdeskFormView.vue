<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
    <!-- Form Area -->
    <div class="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-indigo-700">Laporan Customer</h1>
        <p class="text-lg text-gray-500">Silakan masukkan laporan customer di bawah ini.</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Back Button Above the Form -->
        <div class="text-left mb-6">
          <router-link to="/laporans">
            <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
              Kembali
            </button>
          </router-link>
        </div>

        <!-- Nama Customer -->
        <div>
          <label for="namaCustomer" class="block mb-1 font-medium text-gray-700">Nama Customer</label>
          <input id="namaCustomer" v-model="namaCustomer" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan nama customer" />
        </div>


        <!-- No. Telephone -->
        <div>
          <label for="noTelephone" class="block mb-1 font-medium text-gray-700">No. Telephone</label>
          <input id="noTelephone" v-model="noTelephone" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan no. telephone" />
        </div>

        <!-- Laporan Customer -->
        <div>
          <label for="laporanCustomer" class="block mb-1 font-medium text-gray-700">Laporan Customer</label>
          <input id="laporanCustomer" v-model="laporanCustomer" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan laporan" />
        </div>

        <!-- Lokasi -->
        <div>
          <label for="lokasi" class="block mb-1 font-medium text-gray-700">Lokasi</label>
          <input id="lokasi" v-model="lokasi" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan lokasi" />
        </div>

        <!-- Platform -->
        <div>
          <label for="platform" class="block mb-1 font-medium text-gray-700">Platform</label>
          <select id="platform" v-model="platform" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300">
            <option value="whatsapp">Whatsapp</option>
            <option value="telegram">Telegram</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <!-- Team -->
        <div>
          <label for="team" class="block mb-1 font-medium text-gray-700">Team</label>
          <input id="team" v-model="team" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan team" />
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block mb-1 font-medium text-gray-700">Status</label>
          <select id="status" v-model="status" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300">
            <option value="progress">Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-300 transform hover:scale-105">
          {{ loading ? 'Submitting...' : 'Submit Laporan' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const namaCustomer = ref('');
const noTelephone = ref('');
const laporanCustomer = ref('');
const lokasi = ref('');
const platform = ref('whatsapp');
const team = ref('');
const status = ref('progress');
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();

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
      status: status.value,
    };

    // Send data to API or handle accordingly
    console.log("Laporan Submitted:", laporanData);

    // Reset form after submission
    namaCustomer.value = '';
    noTelephone.value = '';
    laporanCustomer.value = '';
    lokasi.value = '';
    platform.value = 'whatsapp';
    team.value = '';
    status.value = 'progress';

    // Optionally, show a success message or redirect
    alert('Laporan berhasil dikirim!');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Gagal mengirim laporan';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Optional: Customize form and button styles */
</style>
