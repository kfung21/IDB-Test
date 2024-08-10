<template>
    <v-list>
        <v-list-item v-for="job in jobs" :key="job.id">
            <v-card class="pa-3 mb-4" width="100%">
                <v-card-title>{{ job.jobTitle }}</v-card-title>
                <v-card-text>
                    <v-list dense>
                        <v-list-item v-for="(value, key) in job" :key="key">
                            <template v-slot:prepend>
                                <v-list-item-title class="font-weight-bold">{{ formatFieldName(key)
                                    }}:</v-list-item-title>
                            </template>
                            <v-list-item-subtitle>{{ formatFieldValue(key, value) }}</v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="updateJob(job)" color="primary">Update</v-btn>
                    <v-btn @click="deleteJob(job.id)" color="error">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-list-item>
    </v-list>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { onMounted, watch } from 'vue';

const props = defineProps({
    jobs: Array,
});

const emit = defineEmits(['update-job', 'delete-job']);

const updateJob = (job) => {
    // In a real application, you'd open a dialog or form to edit the job
    const updatedJob = { ...job, jobTitle: job.jobTitle + ' (Updated)' };
    emit('update-job', updatedJob);
};

const deleteJob = (id) => {
    emit('delete-job', id);
};

const formatFieldName = (key) => {
    // Convert camelCase to Title Case
    return key.replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
};

const formatFieldValue = (key, value) => {
    if (key === 'id') return value; // Don't format the id
    if (key === 'salary') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    } else if (key === 'closingDate') {
        return new Date(value).toLocaleDateString();
    } else {
        return value;
    }
};

onMounted(() => {
    console.log('Jobs in JobList:', props.jobs);
});

watch(() => props.jobs, (newJobs) => {
    console.log('Jobs updated in JobList:', newJobs);
}, { deep: true });

</script>