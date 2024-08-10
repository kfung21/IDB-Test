<template>
    <div>
        <v-select v-model="jobStore.currentDbName" :items="jobStore.availableDatabases" label="Select Database"
            @update:modelValue="switchDatabase" :disabled="isDeleting"></v-select>

        <v-text-field v-model="searchQuery" label="Search Jobs" @input="searchJobs"></v-text-field>

        <v-list v-if="searchResults.length > 0">
            <v-list-item v-for="job in searchResults" :key="job.id">
                <v-card class="pa-3 mb-4" width="100%">
                    <v-card-title>
                        <v-text-field v-model="job.jobTitle" label="Job Title"></v-text-field>
                    </v-card-title>
                    <v-card-text>
                        <v-list dense>
                            <v-list-item v-for="(value, key) in job" :key="key" density="compact">
                                <template v-slot:prepend>
                                    <strong>{{ formatFieldName(key) }}:</strong>
                                </template>
                                <template v-if="key !== 'id'">
                                    <v-text-field v-if="key === 'salary'" v-model.number="job[key]"
                                        :label="formatFieldName(key)" type="number" prefix="$"
                                        density="compact"></v-text-field>
                                    <v-text-field v-else-if="key === 'closingDate'" v-model="job[key]"
                                        :label="formatFieldName(key)" type="date" density="compact"></v-text-field>
                                    <v-text-field v-else v-model="job[key]" :label="formatFieldName(key)"
                                        density="compact"></v-text-field>
                                </template>
                                <span v-else>{{ value }}</span>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn color="primary" @click="updateJob(job)">Update</v-btn>
                        <v-btn color="error" @click="deleteJob(job.id)">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-list-item>
        </v-list>
        <v-alert v-else-if="searchQuery && searchResults.length === 0" type="info">
            No results found.
        </v-alert>

        <v-btn color="secondary" @click="$router.push('/')">Back to Job Form</v-btn>

        <v-divider class="my-4"></v-divider>

        <v-btn color="info" @click="showDatabaseInfo">Show Database Info</v-btn>
        <v-btn color="warning" @click="confirmDeleteDatabase">Delete Database</v-btn>

        <v-dialog v-model="showDbInfo" max-width="300px">
            <v-card>
                <v-card-title>Database Information</v-card-title>
                <v-card-text v-if="dbInfo">
                    <p>Name: {{ dbInfo.name }}</p>
                    <p>Version: {{ dbInfo.version }}</p>
                    <p>Created: {{ new Date(dbInfo.creationDate).toLocaleString() }}</p>
                </v-card-text>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showDeleteConfirm" max-width="300px" :persistent="isDeleting">
            <v-card>
                <v-card-title>{{ isDeleting ? 'Deleting Database' : 'Confirm Delete' }}</v-card-title>
                <v-card-text>
                    <div v-if="!isDeleting">
                        Are you sure you want to delete the entire database?
                    </div>
                    <div v-else class="text-center">
                        <v-progress-circular indeterminate color="primary" :size="50"></v-progress-circular>
                        <p class="mt-3">Deleting database. Please wait...</p>
                    </div>
                </v-card-text>
                <v-card-actions v-if="!isDeleting">
                    <v-btn color="primary" @click="deleteDatabase">Yes, Delete</v-btn>
                    <v-btn color="error" @click="showDeleteConfirm = false">Cancel</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useJobStore } from '../stores/jobStore';

const jobStore = useJobStore();
const searchQuery = ref('');
const searchResults = computed(() => jobStore.searchResults || []);
const showDbInfo = ref(false);
const showDeleteConfirm = ref(false);
const dbInfo = ref(null);
const isDeleting = ref(false);

const searchJobs = async () => {
    if (searchQuery.value.length > 0) {
        await jobStore.searchJobs(searchQuery.value);
    } else {
        jobStore.searchResults = [];
    }
};

const updateJob = async (job) => {
    await jobStore.updateJob(job);
    await searchJobs(); // Refresh the search results
};

const deleteJob = async (id) => {
    await jobStore.deleteJob(id);
    await searchJobs(); // Refresh the search results
};

const showDatabaseInfo = async () => {
    dbInfo.value = await jobStore.getDatabaseInfo();
    showDbInfo.value = true;
};

const confirmDeleteDatabase = () => {
    showDeleteConfirm.value = true;
};

const deleteDatabase = async () => {
    isDeleting.value = true;
    try {
        await jobStore.deleteDatabase();
        searchQuery.value = '';
        await searchJobs();
    } catch (error) {
        console.error('Error deleting database:', error);
        // You might want to show an error message to the user here
    } finally {
        isDeleting.value = false;
        showDeleteConfirm.value = false;
    }
};

const switchDatabase = async (newDbName) => {
    await jobStore.switchDatabase(newDbName);
    searchQuery.value = ''; // Clear the search query when switching databases
    await searchJobs(); // Refresh the search results for the new database
};

// Add the missing formatFieldName function
const formatFieldName = (key) => {
    return key.replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
};

// Watch for changes in the current database name
watch(() => jobStore.currentDbName, async (newDbName) => {
    if (newDbName) {
        searchQuery.value = ''; // Clear the search query when the database changes
        await searchJobs(); // Refresh the search results for the new database
    }
});
</script>