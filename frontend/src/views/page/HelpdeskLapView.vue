<template>
  <div class="flex">
    <!-- Main Content -->
    <div class="flex-1 p-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-blue-600">Laporan Customer</h1>
      </div>
      <div class="flex justify-end space-x-4 mb-6">
        <!-- Kembali Button -->
        <router-link to="/helpdesks">
          <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
            Kembali
          </button>
        </router-link>

        <!-- Tambah Button -->
        <router-link to="/form">
          <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
            Tambah
          </button>
        </router-link>
      </div>

      <!-- Laporan Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white shadow-lg rounded-lg">
          <thead>
            <tr>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">No</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Nama Customer</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">No. Telephone</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Laporan Customer</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Lokasi</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Platform</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Team</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
  <tr v-if="loading">
    <td colspan="8" class="text-center py-4">Loading...</td>
  </tr>
  <tr v-else-if="laporanList.length === 0">
    <td colspan="8" class="text-center py-4">Belum ada data laporan</td>
  </tr>
  <tr v-for="(laporan, idx) in laporanList" :key="laporan._id">
    <td class="px-6 py-4 text-sm text-gray-700">{{ idx + 1 }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.namaCustomer }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.noTelephone }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.laporanCustomer }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.lokasi }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.platform }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.team }}</td>
    <td class="px-6 py-4 text-sm text-gray-700">{{ laporan.status }}</td>
  </tr>
</tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LaporanAdmin",
  data() {
    return {
      laporanList: [],
      loading: false,
      error: "",
    };
  },
  async mounted() {
    this.loading = true;
    try {
      const res = await axios.get("http://localhost:3000/api/laporan");
      this.laporanList = res.data; // Pastikan backend mengirim array laporan
    } catch (err) {
      this.error = err.response?.data?.error || "Gagal mengambil data laporan";
    } finally {
      this.loading = false;
    }
  },
};
</script>