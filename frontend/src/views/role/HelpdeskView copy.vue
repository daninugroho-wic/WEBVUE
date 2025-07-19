<template>
  <div class="flex">
    <!-- Main Content -->
    <div class="flex-1 p-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-blue-600">Dashboard Admin</h1>
      </div>

      <!-- Statistics Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Finance -->
        <div class="bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700">Finance (Jumlah Laporan)</h2>
          <div class="mt-4 bg-white p-4 rounded-lg shadow-md">
            <p class="text-2xl font-bold text-green-600">50</p>
          </div>
        </div>

        <!-- NOC -->
        <div class="bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700">NOC (Jumlah Laporan)</h2>
          <div class="mt-4 bg-white p-4 rounded-lg shadow-md">
            <p class="text-2xl font-bold text-yellow-500">10</p>
          </div>
        </div>

        <!-- Helpdesk -->
        <div class="bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold text-gray-700">Helpdesk (Jumlah Laporan)</h2>
          <div class="mt-4 bg-white p-4 rounded-lg shadow-md">
            <p class="text-2xl font-bold text-blue-600">30</p>
          </div>
        </div>
      </div>

      <!-- Recent Role Section -->
      <div class="bg-gray-100 p-6 rounded-lg shadow-lg mb-6">
        <h2 class="text-xl font-semibold text-gray-700">Recent Role (History Login Helpdesk)</h2>
        <div class="mt-4 bg-white p-4 rounded-lg shadow-md">
          <p class="text-lg text-gray-700">Helpdesk 1 - 2021-08-05</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DashboardAdmin",
};
</script>

<style scoped>
/* Optional: Customize content styles */
</style>
