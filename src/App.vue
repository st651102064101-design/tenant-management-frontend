<template>
  <div id="app" class="app-container">
    <!-- The navigation bar is displayed across all pages -->
    <Navbar />
    <!-- Main content area where routed components will be shown -->
    <main class="content">
      <router-view />
    </main>
    <!-- Global Apple-style dialog -->
    <AppleDialog ref="appleDialog" />
  </div>
</template>

<script setup>
// Import the shared navigation bar component.  
// Using script setup simplifies component logic by avoiding the need to
// explicitly define and export default objects.
import { ref, onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import AppleDialog from './components/AppleDialog.vue';
import { setDialogInstance } from './composables/useDialog.js';

const appleDialog = ref(null);

onMounted(() => {
  setDialogInstance(appleDialog.value);
});
</script>

<style>
/* Define global layout styles for the app.  
   Using system fonts gives the interface a familiar, neutral feel similar
   to Apple’s default typography. The light grey background and dark text
   provide good contrast and mirror Apple’s minimalist aesthetic. */
.app-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f7;
  color: #1d1d1f;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  padding: 2rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}
</style>