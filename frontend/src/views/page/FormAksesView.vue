<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
    <!-- Form Area -->
    <div class="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-indigo-700">Tambah Hak Akses</h1>
        <p class="text-lg text-gray-500">Silakan masukkan data hak akses di bawah ini.</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Back Button Above the Form -->
        <div class="text-left mb-6">
          <router-link to="/admins">
            <button class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300">
              Kembali
            </button>
          </router-link>
        </div>

        <!-- Role Name -->
        <div>
          <label for="roleName" class="block mb-1 font-medium text-gray-700">Role Name</label>
          <input id="roleName" v-model="roleName" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan nama role" />
        </div>

        <!-- Permissions -->
        <div>
          <label for="permissions" class="block mb-1 font-medium text-gray-700">Permissions</label>
          <input id="permissions" v-model="permissions" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan permissions" />
        </div>

        <!-- Alamat -->
        <div>
          <label for="alamat" class="block mb-1 font-medium text-gray-700">Alamat</label>
          <input id="alamat" v-model="alamat" type="text" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            placeholder="Masukkan alamat" />
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block mb-1 font-medium text-gray-700">Status</label>
          <select id="status" v-model="status" required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300">
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="loading"
          class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition duration-300 transform hover:scale-105">
          {{ loading ? 'Submitting...' : 'Tambah Hak Akses' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const roleName = ref('');
const permissions = ref('');
const alamat = ref('');
const status = ref('on');
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const handleSubmit = async () => {
  if (!roleName.value || !permissions.value || !alamat.value) {
    errorMessage.value = 'Semua kolom wajib diisi!';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const hakAksesData = {
      roleName: roleName.value,
      permissions: permissions.value,
      alamat: alamat.value,
      status: status.value,
    };

    // Send data to API or handle accordingly
    console.log("Hak Akses Submitted:", hakAksesData);

    // Reset form after submission
    roleName.value = '';
    permissions.value = '';
    alamat.value = '';
    status.value = 'on';

    // Optionally, show a success message or redirect
    alert('Hak Akses berhasil ditambahkan!');
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Gagal menambahkan hak akses';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back(); // Goes back to the previous page
};
</script>