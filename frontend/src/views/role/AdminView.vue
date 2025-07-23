<template>
    <div class="flex">
        <!-- Sidebar -->
        <aside id="logo-sidebar" :class="[
            'fixed top-0 left-0 z-40 h-full w-20 bg-white shadow-lg dark:bg-gray-900 transform transition-transform duration-300 ease-in-out overflow-y-auto sm:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ]" aria-label="Sidebar">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <a href="https://flowbite.com/" class="flex items-center">
                    <img src="https://flowbite.com/docs/images/logo.svg" alt="Logo" class="h-8 w-auto" />
                </a>
                <button @click="toggleSidebar"
                    class="sm:hidden text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    aria-label="Close sidebar">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav class="mt-5">
                <ul class="space-y-4 px-2">

                    <li>
                        <router-link to="/akses"
                            class="flex justify-center items-center p-4 rounded-lg text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-800 group"
                            active-class="bg-green-200 dark:bg-green-900 font-semibold">
                            <svg class="w-8 h-8 text-green-500 group-hover:text-green-700 dark:group-hover:text-green-300"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" viewBox="0 0 24 24">
                                <path d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                                <path d="M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                            </svg>
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/laporan"
                            class="flex justify-center items-center p-4 rounded-lg text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800 group"
                            active-class="bg-blue-200 dark:bg-blue-900 font-semibold">
                            <svg class="w-8 h-8 text-blue-500 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" viewBox="0 0 24 24">
                                <path d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                                <path d="M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                            </svg>
                        </router-link>
                    </li>
                    <li>
                        <!-- filepath: d:\CHAT\frontend\src\views\role\AdminView.vue -->
                    <li>
                        <button @click="handleLogout"
                            class="flex justify-center items-center p-4 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 group w-full">
                            <svg class="w-8 h-8 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-400"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" viewBox="0 0 24 24">
                                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                                <path d="M10 17l5-5-5-5v10z" />
                            </svg>
                            <span class="sr-only">Logout</span>
                        </button>
                    </li>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 ml-20 p-6">
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
            <div class="bg-gray-100 p-6 rounded-lg shadow-lg">
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
    data() {
        return {
            sidebarOpen: false,
        };
    },
    methods: {
        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },
        handleLogout() {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            this.$router.replace({ path: '/' });
            // Optional: reload page to clear all state
            window.location.reload();
        },
    },
};
</script>