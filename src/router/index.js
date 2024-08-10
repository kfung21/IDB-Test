import { createRouter, createWebHistory } from 'vue-router';
import JobForm from '../components/JobForm.vue';
import SearchJobs from '../components/SearchJobs.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: JobForm,
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchJobs,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;