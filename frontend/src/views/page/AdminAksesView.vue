<template>
  <div class="flex">
    <!-- Main Content -->
    <div class="flex-1 p-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-blue-600">Hak Akses</h1>
      </div>
      <div class="flex justify-end space-x-4 mb-6">
        <!-- Kembali Button -->
        <router-link to="/admins">

          <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
            Kembali
          </button>
        </router-link>

        <!-- Tambah Button -->
        <router-link to="/formakses">
          <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
            Tambah
          </button>
        </router-link>
      </div>
      <!-- Tabel Hak Akses -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white shadow-lg rounded-lg">
          <thead>
            <tr>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">No</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Role Name</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Permission</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Alamat</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Status</th>
              <th class="px-6 py-3 bg-gray-100 text-left text-sm font-medium text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="px-6 py-4 text-sm text-gray-700">1</td>
              <td class="px-6 py-4 text-sm text-gray-700">Admin</td>
              <td class="px-6 py-4 text-sm text-gray-700">Full Access</td>
              <td class="px-6 py-4 text-sm text-gray-700">Jl. Contoh 1</td>
              <td class="px-6 py-4 text-sm text-gray-700">
                <span class="text-green-600">On</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">
                <button class="text-blue-600 hover:underline">Edit</button>
                <button class="text-red-600 hover:underline ml-2">Delete</button>
              </td>
            </tr>
            <tr>
              <td class="px-6 py-4 text-sm text-gray-700">2</td>
              <td class="px-6 py-4 text-sm text-gray-700">Helpdesk</td>
              <td class="px-6 py-4 text-sm text-gray-700">View Only</td>
              <td class="px-6 py-4 text-sm text-gray-700">Jl. Contoh 2</td>
              <td class="px-6 py-4 text-sm text-gray-700">
                <span class="text-red-600">Off</span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-700">
                <button class="text-blue-600 hover:underline">Edit</button>
                <button class="text-red-600 hover:underline ml-2">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HakAkses",
};
</script>

<style scoped>
/* Optional: Customize table and button styles */
</style>
