// Router configuration for the application.  
// Vue Router enables navigation between different pages of the app without
// reloading the page. Each route maps to a component that is rendered when
// the user visits the path.

import { createRouter, createWebHistory } from 'vue-router';

import Home from '../components/Home.vue';
import TenantList from '../components/TenantList.vue';
import Reports from '../components/Reports.vue';
import Packages from '../components/DataManagement.vue';
import PiControl from '../components/PiControl.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/tenants', name: 'Tenants', component: TenantList },
  { path: '/reports', name: 'Reports', component: Reports },
  // Additional route for scanned package management
  { path: '/packages', name: 'Packages', component: Packages },
  // Pi Control page
  { path: '/pi', name: 'PiControl', component: PiControl },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;