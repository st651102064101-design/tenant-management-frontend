<template>
  <section class="apple-home">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">Tenant Manager</span>
        </h1>
        <p class="hero-subtitle">
          ระบบจัดการผู้เช่าอัจฉริยะ ที่ช่วยให้คุณดูแลข้อมูลผู้เช่า<br>
          จัดการพัสดุ และดูรายงานได้อย่างง่ายดาย
        </p>
        <div class="hero-actions">
          <router-link to="/tenants" class="primary-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            จัดการผู้เช่า
          </router-link>
          <router-link to="/packages" class="secondary-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/>
            </svg>
            ดูพัสดุ
          </router-link>
        </div>
      </div>
    </div>
    
    <div class="features-section">
      <h2 class="section-title">คุณสมบัติหลัก</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon blue">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h3>จัดการผู้เช่า</h3>
          <p>เพิ่ม แก้ไข และลบข้อมูลผู้เช่าได้อย่างสะดวก พร้อมค้นหาและกรองข้อมูลแบบ Real-time</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon green">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
            </svg>
          </div>
          <h3>ติดตามพัสดุ</h3>
          <p>ระบบสแกน OCR อัจฉริยะ จับคู่พัสดุกับผู้เช่าอัตโนมัติ พร้อมแจ้งเตือนสถานะ</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon purple">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c0 1.1-.9 2-2 2V5c0-1.1.9-2 2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3>รายงานครบถ้วน</h3>
          <p>ดูสถิติและรายงานต่างๆ พร้อมส่งออกข้อมูลในรูปแบบ Excel และ PDF</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon orange">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <h3>ปลอดภัย</h3>
          <p>ข้อมูลถูกจัดเก็บอย่างปลอดภัยในฐานข้อมูล พร้อมระบบสำรองข้อมูลอัตโนมัติ</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.apple-home {
  min-height: calc(100vh - 48px);
}

.hero-section {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 480px;
  padding: 80px 24px;
  text-align: center;
  background: linear-gradient(180deg, #FFFFFF 0%, #F2F2F7 100%);
}

.hero-content {
  max-width: 680px;
}

.hero-title {
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -0.009em;
  line-height: 1.05;
  margin-bottom: 24px;
}

.gradient-text {
  background: linear-gradient(90deg, #007AFF, #5856D6, #AF52DE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 21px;
  line-height: 1.52381;
  font-weight: 400;
  letter-spacing: 0.011em;
  color: #86868B;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.primary-btn, .secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  border-radius: 100px;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.022em;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.primary-btn {
  background: #007AFF;
  color: #FFFFFF;
}

.primary-btn:hover {
  background: #0056CC;
  transform: scale(1.02);
  text-decoration: none;
}

.secondary-btn {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.secondary-btn:hover {
  background: rgba(0, 122, 255, 0.15);
  transform: scale(1.02);
  text-decoration: none;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.features-section {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.003em;
  text-align: center;
  margin-bottom: 48px;
  color: #1D1D1F;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
  color: #FFFFFF;
}

.feature-icon.blue {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
}

.feature-icon.green {
  background: linear-gradient(135deg, #34C759, #30D158);
}

.feature-icon.purple {
  background: linear-gradient(135deg, #5856D6, #AF52DE);
}

.feature-icon.orange {
  background: linear-gradient(135deg, #FF9500, #FF3B30);
}

.feature-card h3 {
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 0.011em;
  margin-bottom: 12px;
  color: #1D1D1F;
}

.feature-card p {
  font-size: 15px;
  line-height: 1.47059;
  color: #86868B;
  margin: 0;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 40px 16px;
  }

  .hero-title {
    font-size: 36px;
  }
  
  .hero-subtitle {
    font-size: 16px;
    line-height: 1.5;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  
  .primary-btn, .secondary-btn {
    width: 100%;
    max-width: 100%;
    justify-content: center;
    padding: 14px 24px;
  }

  .features-section {
    padding: 40px 16px;
  }
  
  .section-title {
    font-size: 28px;
    margin-bottom: 24px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .feature-card {
    padding: 24px;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
  }

  .feature-icon svg {
    width: 24px;
    height: 24px;
  }

  .feature-card h3 {
    font-size: 19px;
  }

  .feature-card p {
    font-size: 14px;
  }
}
</style>