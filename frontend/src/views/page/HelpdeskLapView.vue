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
            <tr>
              <td class="px-6 py-4 text-sm text-gray-700">1</td>
              <td class="px-6 py-4 text-sm text-gray-700">Dani Nigroho Wijaksono</td>
              <td class="px-6 py-4 text-sm text-gray-700">083868474123</td>
              <td class="px-6 py-4 text-sm text-gray-700">Ping 100</td>
              <td class="px-6 py-4 text-sm text-gray-700">Solo</td>
              <td class="px-6 py-4 text-sm text-gray-700">Whatsapp</td>
              <td class="px-6 py-4 text-sm text-gray-700">NOC</td>
              <td class="px-6 py-4 text-sm text-gray-700">Progress</td>
            </tr>
            <!-- Additional Rows -->
            <tr>
              <td class="px-6 py-4 text-sm text-gray-700">2</td>
              <td class="px-6 py-4 text-sm text-gray-700">cusName</td>
              <td class="px-6 py-4 text-sm text-gray-700">cusPhone</td>
              <td class="px-6 py-4 text-sm text-gray-700">cusReport</td>
              <td class="px-6 py-4 text-sm text-gray-700">location</td>
              <td class="px-6 py-4 text-sm text-gray-700">platform</td>
              <td class="px-6 py-4 text-sm text-gray-700">forTeam</td>
              <td class="px-6 py-4 text-sm text-gray-700">Status</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LaporanAdmin",
};
</script>

<style scoped>
/* Optional: Customize table and button styles */
</style>
