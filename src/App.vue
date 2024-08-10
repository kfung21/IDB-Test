<template>
  <v-app>
    <v-app-bar app>
      <v-app-bar-title>Job Listings Application</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="offlineReady" icon @click="updateServiceWorker">
        <v-icon>mdi-cloud-download</v-icon>
      </v-btn>
      <v-btn v-if="needRefresh" icon @click="refreshApp">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view></router-view>
      </v-container>
    </v-main>

    <v-snackbar v-model="showOfflineReady" timeout="-1">
      App ready to work offline
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="closeOfflineReady">Close</v-btn>
      </template>
    </v-snackbar>

    <v-snackbar v-model="showNeedRefresh" timeout="-1">
      New content available, click on refresh button to update.
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="refreshApp">Refresh</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useJobStore } from './stores/jobStore';

const jobStore = useJobStore();

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(swUrl, r) {
    console.log('Service Worker registered');
  },
  onRegisterError(error) {
    console.error('Service Worker registration error', error);
  }
});

const showOfflineReady = ref(false);
const showNeedRefresh = ref(false);

const closeOfflineReady = () => {
  showOfflineReady.value = false;
  offlineReady.value = false;
};

const refreshApp = async () => {
  try {
    await updateServiceWorker();
    needRefresh.value = false;
    showNeedRefresh.value = false;
  } catch (error) {
    console.error('Error updating Service Worker', error);
    // You might want to show an error message to the user here
  }
};

onMounted(async () => {
  try {
    await jobStore.initializeStore();
  } catch (error) {
    console.error('Error initializing store', error);
    // Handle error (e.g., show an error message to the user)
  }
});

watch(offlineReady, (val) => {
  showOfflineReady.value = val;
});

watch(needRefresh, (val) => {
  showNeedRefresh.value = val;
});
</script>