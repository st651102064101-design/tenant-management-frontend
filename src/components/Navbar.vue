<template>
  <nav class="apple-navbar">
    <div class="navbar-container">
      <router-link to="/" class="brand">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        <span>Tenant Manager</span>
      </router-link>
      <ul class="nav-links">
        <li>
          <router-link to="/" class="nav-item" exact>
            <span class="nav-text">หน้าหลัก</span>
          </router-link>
        </li>
        <li>
          <router-link to="/tenants" class="nav-item">
            <span class="nav-text">ผู้เช่า</span>
          </router-link>
        </li>
        <li>
          <router-link to="/packages" class="nav-item">
            <span class="nav-text">พัสดุ</span>
          </router-link>
        </li>
        <li>
          <router-link to="/reports" class="nav-item">
            <span class="nav-text">รายงาน</span>
          </router-link>
        </li>
        <li>
          <router-link to="/pi" class="nav-item">
            <span class="nav-text">🥧 Pi</span>
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.apple-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  height: 48px;
  max-width: 1200px;
  margin: 0 auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 21px;
  letter-spacing: -0.011em;
  color: #1d1d1f;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.brand:hover {
  opacity: 0.7;
  text-decoration: none;
}

.brand-icon {
  width: 24px;
  height: 24px;
  color: #007AFF;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.016em;
  color: #1d1d1f;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.nav-item:hover {
  background: rgba(0, 0, 0, 0.04);
  text-decoration: none;
}

.nav-item.router-link-active,
.nav-item.router-link-exact-active {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  font-weight: 500;
}

.nav-text {
  position: relative;
}

@media (max-width: 768px) {
  .apple-navbar {
    padding: 10px 0;
  }

  .navbar-container {
    padding: 0 12px;
  }
  
  .brand {
    font-size: 16px;
  }

  .brand-icon {
    width: 24px;
    height: 24px;
  }
  
  .brand span {
    display: none;
  }
  
  .nav-links {
    gap: 2px;
  }
  
  .nav-item {
    padding: 8px 10px;
    font-size: 13px;
    border-radius: 10px;
  }

  .nav-text {
    white-space: nowrap;
  }
}
</style>
