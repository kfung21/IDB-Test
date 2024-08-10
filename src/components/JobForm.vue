<template>
    <v-form v-model="isFormValid" @submit.prevent="submitForm">
        <v-select v-model="jobStore.currentDbName" :items="jobStore.availableDatabases" label="Select Database"
            @update:modelValue="switchDatabase"></v-select>

        <v-text-field v-model="newDbName" label="New Database Name"></v-text-field>
        <v-btn @click="createNewDb" color="success" :disabled="!newDbName">Create New Database</v-btn>

        <v-divider class="my-4"></v-divider>

        <v-text-field v-model="job.jobTitle" label="Job Title"
            :rules="[v => !v || v.length > 0 || 'Job Title cannot be empty']"></v-text-field>

        <v-text-field v-model.number="job.salary" label="Salary" type="number" prefix="$"
            :rules="[v => !v || v > 0 || 'Salary must be greater than 0']"></v-text-field>

        <v-text-field v-model="job.closingDate" label="Closing Date" type="date"
            :rules="[v => !v || isValidDate(v) || 'Invalid date format']"></v-text-field>

        <v-text-field v-model="job.agency" label="Agency"></v-text-field>

        <v-text-field v-model="job.city" label="City"></v-text-field>

        <v-text-field v-model="job.county" label="County"></v-text-field>

        <v-btn type="submit" color="primary" :disabled="!isAnyFieldFilled">Add Job</v-btn>
        <v-btn color="secondary" @click="$router.push('/search')">Go to Search</v-btn>
    </v-form>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useJobStore } from '../stores/jobStore';

const jobStore = useJobStore();
const isFormValid = ref(true);
const newDbName = ref('');

const job = ref({
    jobTitle: '',
    salary: null,
    closingDate: '',
    agency: '',
    city: '',
    county: '',
});

const isAnyFieldFilled = computed(() => {
    return Object.values(job.value).some(value => value !== '' && value !== null);
});

const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

const submitForm = async () => {
    if (isFormValid.value && isAnyFieldFilled.value) {
        const jobToSubmit = {};
        for (const [key, value] of Object.entries(job.value)) {
            if (value !== '' && value !== null) {
                jobToSubmit[key] = value;
            }
        }
        await jobStore.addJob(jobToSubmit);
        // Reset form after submission
        job.value = {
            jobTitle: '',
            salary: null,
            closingDate: '',
            agency: '',
            city: '',
            county: '',
        };
    }
};

const createNewDb = async () => {
    if (newDbName.value.trim() !== '') {
        await jobStore.createNewDatabase(newDbName.value);
        newDbName.value = ''; // Clear the input after creating the database
    }
};

const switchDatabase = async (newDbName) => {
    await jobStore.switchDatabase(newDbName);
};
</script>