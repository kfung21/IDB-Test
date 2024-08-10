<template>
  <v-app>
    <v-main>
      <v-container>
        <h1>Job Listings Application</h1>
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue';
import { useJobStore } from './stores/jobStore';

const jobStore = useJobStore();

onMounted(async () => {
  await jobStore.initializeStore();
});
</script>