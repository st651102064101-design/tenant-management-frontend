// Entry point for the Vue application.  
// This file creates a Vue app, registers the router and mounts the
// root component (App.vue) to the DOM.  
// Global styles are imported from the assets directory.

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import $ from 'jquery';

import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles.css';

// Make jQuery available globally for DataTables
window.$ = $;

const app = createApp(App);

app.use(router);

app.mount('#app');