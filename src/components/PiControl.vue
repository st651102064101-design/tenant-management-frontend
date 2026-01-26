<template>
  <div class="pi-control-page">
    <div class="page-header">
      <h1>🥧 จัดการ Raspberry Pi</h1>
      <p class="subtitle">ควบคุมระบบ OCR บน Raspberry Pi</p>
    </div>

    <!-- Pi Info Card -->
    <div class="info-card">
      <h2>ข้อมูลระบบ</h2>
      <div class="row g-3 align-items-start info-grid" v-if="piInfo">
        <div class="info-item col-12 col-md-6">
          <span class="info-label">⏱️ เวลาทำงาน</span>
          <span class="info-value">{{ piInfo.uptime || 'ไม่ทราบ' }}</span>
        </div>
        <div class="info-item col-12 col-md-6">
          <span class="info-label">🌡️ อุณหภูมิ CPU</span>
          <span class="info-value">{{ piInfo.cpuTemp || 'N/A' }}</span>
        </div>
        <div class="info-item col-12 col-md-6">
          <span class="info-label">💾 หน่วยความจำ</span>
          <span class="info-value" :title="formatMemoryTooltip(piInfo)">{{ piInfo.memoryDisplay || 'N/A' }}</span>
          <small v-if="piInfo && piInfo.memoryUsage" class="memory-detail">
            <span class="mem-col mem-left">{{ piInfo.memoryUsage.mb }}</span>
            <span class="mem-col mem-right">{{ piInfo.memoryUsage.kb }}</span>
          </small>
        </div>
        <div class="info-item col-12 col-md-6">
          <span class="info-label">📡 สถานะบริการ OCR</span>
          <span class="info-value" :class="{ 'status-active': serviceStatus.isRunning, 'status-inactive': !serviceStatus.isRunning }">
            {{ serviceStatus.isRunning ? '🟢 ทำงานอยู่' : '🔴 หยุดทำงาน' }}
          </span>
        </div>
      </div>
      <div v-else class="loading">
        <span>กำลังโหลด...</span>
      </div>
      <button @click="refreshInfo" class="btn-refresh" :disabled="loading">
        🔄 รีเฟรช
      </button>
    </div>

    <!-- Control Buttons -->
    <div class="control-section">
      <h2>ควบคุมบริการ OCR</h2>
      <div class="button-grid">
        <button 
          @click="controlService('start')" 
          class="control-btn btn-start"
          :disabled="loading || serviceStatus.isRunning"
          data-tooltip="เริ่มบริการ OCR — เปิดการสแกนภาพและส่งผลไปยังระบบ"
          title="เริ่มบริการ OCR">
          <span class="btn-icon">▶️</span>
          <span class="btn-text">เริ่มระบบ</span>
        </button>
        <button 
          @click="controlService('stop')" 
          class="control-btn btn-stop"
          :disabled="loading || !serviceStatus.isRunning"
          data-tooltip="หยุดบริการ OCR ชั่วคราว — หยุดการสแกนและการแจ้งเตือนเสียง"
          title="หยุดบริการ OCR">
          <span class="btn-icon">⏹️</span>
          <span class="btn-text">หยุดระบบ</span>
        </button>
        <button 
          @click="controlService('restart')" 
          class="control-btn btn-restart"
          :disabled="loading"
          data-tooltip="รีสตาร์ทบริการ OCR — หยุดแล้วเริ่มบริการใหม่เพื่อแก้ปัญหาเบื้องต้น"
          title="รีสตาร์ทบริการ OCR">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">รีสตาร์ท</span>
        </button>
        <button 
          @click="rebootPi" 
          class="control-btn btn-reboot"
          :disabled="loading"
          data-tooltip="รีบูท Raspberry Pi — รีสตาร์ทเครื่องทั้งระบบ (ใช้ในกรณีที่ระบบไม่ตอบสนอง)"
          title="รีบูท Raspberry Pi">
          <span class="btn-icon">⚡</span>
          <span class="btn-text">รีบูท Pi</span>
        </button>
      </div>
    </div>

    <!-- Speak Section -->
    <div class="speak-section">
      <h2>🔊 พูดข้อความ</h2>
      <div class="speak-form">
        <input 
          v-model="speakText" 
          type="text" 
          placeholder="พิมพ์ข้อความที่ต้องการให้ Pi พูด..."
          @keyup.enter="speakOnPi"
          :disabled="loading"
        />
        <button @click="speakOnPi" class="btn-speak" :disabled="loading || !speakText.trim()">
          🔊 พูด
        </button>
      </div>
      <div class="quick-speak">
        <span class="quick-label">พูดด่วน:</span>
        <button @click="quickSpeak('สวัสดี')" class="quick-btn">สวัสดี</button>
        <button @click="quickSpeak('มีพัสดุมาส่ง')" class="quick-btn">มีพัสดุมาส่ง</button>
        <button @click="quickSpeak('พร้อมถ่ายแล้ว')" class="quick-btn">พร้อมถ่ายแล้ว</button>
        <button @click="quickSpeak('ขอบคุณครับ')" class="quick-btn">ขอบคุณครับ</button>
      </div>
    </div>

    <!-- Volume Control Section -->
    <div class="control-section">
      <h2>🔊 ระดับเสียงพูด</h2>
      <div class="volume-control">
        <div class="volume-display">
          <span class="volume-icon">{{ volume === 0 ? '🔇' : volume < 30 ? '🔈' : volume < 70 ? '🔉' : '🔊' }}</span>
          <span class="volume-value">{{ volume }}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="5" 
          :value="volume" 
          @input="updateVolume"
          class="volume-slider"
        />
        <div class="volume-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>

    <!-- Logs Section -->
    <div class="logs-section">
      <div class="logs-header">
        <h2>📋 OCR Logs (Realtime)</h2>
        <button 
          @click="toggleAutoScroll" 
          class="log-control-btn"
          :class="{ active: autoScroll }"
        >
          {{ autoScroll ? '📌 Auto Scroll ON' : '📌 Auto Scroll OFF' }}
        </button>
        <button 
          @click="clearLogs" 
          class="log-control-btn"
        >
          🗑️ Clear
        </button>
        <button 
          @click="refreshLogs" 
          class="log-control-btn"
          :disabled="loading"
        >
          🔄 Refresh
        </button>
      </div>
      <div class="logs-container" ref="logsContainer">
        <div v-if="!logs.length" class="logs-empty">
          <p>ยังไม่มี log สำหรับแสดง</p>
          <p class="logs-hint">กดปุ่ม Refresh เพื่อดึง log ล่าสุด</p>
        </div>
        <div v-else>
          <div 
            v-for="(log, index) in logs" 
            :key="index" 
            class="log-line"
            :class="{
              'log-scan': log.message.includes('Scanning') || log.message.includes('scanning'),
              'log-match': log.message.includes('Found') || log.message.includes('Matched'),
              'log-send': log.message.includes('Sending') || log.message.includes('sending'),
              'log-error': log.message.includes('Error') || log.message.includes('error'),
              'log-skip': log.message.includes('[DUPLICATE]') || log.message.includes('Skipping')
            }"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Message -->
    <div v-if="message" class="status-message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { piAPI } from '../api.js';
import { useDialog } from '../composables/useDialog.js';
import { WS_URL } from '../config.js';

const { confirm: showConfirm } = useDialog();

let ws = null; // WebSocket instance
function connectWebSocket() {
  if (ws) {
    ws.close();
  }
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    console.log('[WebSocket] Connected to server (PiControl)');
  };
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'pi-info') {
        // Update piInfo and serviceStatus based on broadcast
        if (message.data && message.data.success) {
          piInfo.value = {
            uptime: message.data.uptime,
            cpuTemp: message.data.cpuTemp,
            memoryDisplay: message.data.memoryDisplay,
            memoryUsage: message.data.memoryUsage
          };
          serviceStatus.value = { status: message.data.status, isRunning: message.data.isRunning };
        } else {
          // On error broadcasts, clear or set error
          console.warn('[WebSocket] pi-info error:', message.data && message.data.error);
        }
      }
    } catch (e) {
      console.error('[WebSocket] Error parsing message:', e);
    }
  };
  ws.onclose = () => {
    console.log('[WebSocket] Disconnected (PiControl), reconnecting in 3s...');
    setTimeout(connectWebSocket, 3000);
  };
  ws.onerror = (err) => console.error('[WebSocket] Error (PiControl):', err);
}

const loading = ref(false);
const message = ref('');
const messageType = ref('');
const speakText = ref('');
const piInfo = ref(null);
const serviceStatus = ref({ status: 'unknown', isRunning: false });
const logs = ref([]);
const logsContainer = ref(null);
const autoScroll = ref(true);
const logRefreshInterval = ref(null);
const pauseRefresh = ref(false);
const volume = ref(80);

const showMessage = (text, type = 'success') => {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const refreshInfo = async () => {
  loading.value = true;
  try {
    const [info, status] = await Promise.all([
      piAPI.getInfo(),
      piAPI.getStatus(),
    ]);
    piInfo.value = info;
    serviceStatus.value = status;
  } catch (err) {
    console.error('Error refreshing info:', err);
    showMessage('ไม่สามารถเชื่อมต่อกับ Pi ได้: ' + err.message, 'error');
  } finally {
    loading.value = false;
  }
};

const refreshLogs = async () => {
  // Skip refresh if recently cleared
  if (pauseRefresh.value) return;
  
  try {
    const response = await piAPI.getLogs();
    logs.value = response.logs;
    
    if (autoScroll.value && logsContainer.value) {
      await nextTick();
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  } catch (err) {
    console.error('Error refreshing logs:', err);
    showMessage('ไม่สามารถดึง log ได้: ' + err.message, 'error');
  }
};

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value;
};

const clearLogs = async () => {
  const confirmed = await showConfirm('ยืนยันการลบ log ทั้งหมด?', 'ยืนยันการลบ');
  if (!confirmed) return;
  
  try {
    await piAPI.clearLogs();
    logs.value = [];
    pauseRefresh.value = true;
    // Resume refresh after 5 seconds
    setTimeout(() => {
      pauseRefresh.value = false;
    }, 5000);
    showMessage('ลบ log สำเร็จ', 'success');
  } catch (err) {
    showMessage('ไม่สามารถลบ log ได้: ' + err.message, 'error');
  }
};

const startAutoRefresh = () => {
  // Refresh logs every 2 seconds
  logRefreshInterval.value = setInterval(refreshLogs, 2000);
};

const stopAutoRefresh = () => {
  if (logRefreshInterval.value) {
    clearInterval(logRefreshInterval.value);
    logRefreshInterval.value = null;
  }
};

const controlService = async (action) => {
  const actionNames = {
    start: 'เริ่มระบบ',
    stop: 'หยุดระบบ', 
    restart: 'รีสตาร์ทระบบ',
  };
  
  const confirmed = await showConfirm(`ยืนยันการ${actionNames[action]}?`, 'ยืนยันการดำเนินการ');
  if (!confirmed) return;
  
  loading.value = true;
  try {
    const result = await piAPI.control(action);
    showMessage(`${actionNames[action]}สำเร็จ`, 'success');
    serviceStatus.value = { status: result.status, isRunning: result.isRunning };
    // Refresh info after control action
    setTimeout(refreshInfo, 2000);
  } catch (err) {
    showMessage(`${actionNames[action]}ไม่สำเร็จ: ` + err.message, 'error');
  } finally {
    loading.value = false;
  }
};

const rebootPi = async () => {
  const confirmed = await showConfirm('Pi จะรีสตาร์ทและไม่สามารถใช้งานได้ชั่วคราว\n\nยืนยันการรีบูท Raspberry Pi?', 'ยืนยันการรีบูท');
  if (!confirmed) return;
  
  loading.value = true;
  try {
    await piAPI.reboot();
    showMessage('ส่งคำสั่งรีบูทแล้ว Pi จะรีสตาร์ทในไม่ช้า', 'success');
  } catch (err) {
    showMessage('ไม่สามารถรีบูท Pi ได้: ' + err.message, 'error');
  } finally {
    loading.value = false;
  }
};

const speakOnPi = async () => {
  if (!speakText.value.trim()) return;
  
  loading.value = true;
  try {
    await piAPI.speak(speakText.value);
    showMessage('ส่งข้อความพูดไปยัง Pi แล้ว', 'success');
    speakText.value = '';
  } catch (err) {
    showMessage('ไม่สามารถพูดได้: ' + err.message, 'error');
  } finally {
    loading.value = false;
  }
};

const quickSpeak = (text) => {
  speakText.value = text;
  speakOnPi();
};

const loadVolume = async () => {
  try {
    const response = await piAPI.getVolume();
    volume.value = response.volume;
  } catch (err) {
    console.error('Error loading volume:', err);
  }
};

const updateVolume = async (event) => {
  const newVolume = parseInt(event.target.value);
  volume.value = newVolume;
  try {
    await piAPI.setVolume(newVolume);
    showMessage(`ปรับระดับเสียงเป็น ${newVolume}%`, 'success');
  } catch (err) {
    showMessage('ไม่สามารถปรับระดับเสียงได้: ' + err.message, 'error');
  }
};

function formatMemoryTooltip(info) {
  if (!info || !info.memoryUsage) return '';
  const m = info.memoryUsage;
  const kb = m.kb || m.kb === 0 ? m.kb : '-';
  const mb = m.mb || '-';
  const gb = m.gb || '-';
  return `KB: ${kb}\nMB: ${mb}\nGB: ${gb}`;
}

onMounted(() => {
  refreshInfo();
  refreshLogs();
  startAutoRefresh();
  loadVolume();
});


onMounted(() => {
  refreshInfo();
});
</script>

<style scoped>
.memory-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-top: 6px;
  color: #8b8b90;
  font-size: 12px;
  max-width: 260px; /* keep columns compact */
  align-items: center;
}

.memory-detail .mem-col {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.memory-detail .mem-left {
  text-align: left;
}

.memory-detail .mem-right {
  text-align: right;
  color: #6b6b70;
  font-variant-numeric: tabular-nums;
}
.pi-control-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #1d1d1f;
}

.subtitle {
  color: #86868b;
  font-size: 1.1rem;
}

.info-card {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.info-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1d1d1f;
  font-size: 1.3rem;
}

/* Using Bootstrap grid for .info-grid (row + col classes) */
/* No custom grid needed here; Bootstrap handles column layout. */

/* Apple-style tooltip for buttons */
[data-tooltip] {
  position: relative;
}
[data-tooltip]:hover::after,
[data-tooltip]:focus::after {
  opacity: 1;
  transform: translateY(0);
  visibility: visible;
}
[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: rgba(60,60,67,0.95);
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.3;
  white-space: nowrap;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  opacity: 0;
  visibility: hidden;
  transition: opacity 160ms cubic-bezier(.2,.8,.2,1), transform 160ms cubic-bezier(.2,.8,.2,1);
  z-index: 50;
}
[data-tooltip]::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(60,60,67,0.95);
  z-index: 51;
  opacity: 0;
  visibility: hidden;
  transition: opacity 160ms;
}
[data-tooltip]:hover::before,
[data-tooltip]:focus::before {
  opacity: 1;
  visibility: visible;
}

/* Ensure tooltip works on focus for keyboard users */
[data-tooltip]:focus {
  outline: none;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  color: #86868b;
  font-size: 0.9rem;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 500;
  color: #1d1d1f;
}

.status-active {
  color: #34c759 !important;
}

.status-inactive {
  color: #ff3b30 !important;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #86868b;
}

.btn-refresh {
  background: #f5f5f7;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #e8e8ed;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.control-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1d1d1f;
  font-size: 1.3rem;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.btn-text {
  font-size: 1rem;
}

.btn-start {
  background: #d1f2d1;
  color: #1a7a1a;
}

.btn-start:hover:not(:disabled) {
  background: #b8e8b8;
}

.btn-stop {
  background: #ffd6d6;
  color: #c41c1c;
}

.btn-stop:hover:not(:disabled) {
  background: #ffc0c0;
}

.btn-restart {
  background: #fff3d1;
  color: #996600;
}

.btn-restart:hover:not(:disabled) {
  background: #ffe8a8;
}

.btn-reboot {
  background: #e8d5f5;
  color: #6b2d9b;
}

.btn-reboot:hover:not(:disabled) {
  background: #dcc0f0;
}

.speak-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.speak-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #1d1d1f;
  font-size: 1.3rem;
}

.speak-form {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.speak-form input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.speak-form input:focus {
  border-color: #007aff;
}

.btn-speak {
  background: #007aff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-speak:hover:not(:disabled) {
  background: #0056b3;
}

.btn-speak:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-speak {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.quick-label {
  color: #86868b;
  font-size: 0.9rem;
}

.quick-btn {
  background: #f5f5f7;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #e8e8ed;
}

/* Volume Control */
.volume-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 12px;
}

.volume-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1d1d1f;
}

.volume-icon {
  font-size: 1.8rem;
}

.volume-value {
  min-width: 60px;
  text-align: center;
}

.volume-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, 
    #d1f2d1 0%, 
    #34c759 50%, 
    #007aff 100%);
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 3px solid #007aff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 12px rgba(0,0,0,0.3);
}

.volume-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 3px solid #007aff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.volume-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 12px rgba(0,0,0,0.3);
}

.volume-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #86868b;
  padding: 0 4px;
}

.logs-section {
  margin-top: 24px;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.logs-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1d1d1f;
}

.log-control-btn {
  padding: 8px 14px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.log-control-btn:hover:not(:disabled) {
  background: #0052cc;
  transform: translateY(-1px);
}

.log-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.log-control-btn.active {
  background: #34c759;
}

.logs-container {
  height: 400px;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #e0e0e0;
  border: 1px solid #333;
}

.logs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.logs-empty p {
  margin: 4px 0;
}

.logs-hint {
  font-size: 11px;
  color: #555;
}

.log-line {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #2a2a2a;
  align-items: flex-start;
}

.log-line:last-child {
  border-bottom: none;
}

.log-time {
  color: #888;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 11px;
}

.log-message {
  color: #e0e0e0;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-scan {
  background: rgba(0, 122, 255, 0.1);
  color: #64b5f6;
}

.log-match {
  background: rgba(52, 199, 89, 0.1);
  color: #81c784;
}

.log-send {
  background: rgba(255, 159, 64, 0.1);
  color: #ffb74d;
}

.log-error {
  background: rgba(244, 67, 54, 0.1);
  color: #ef5350;
}

.log-skip {
  background: rgba(156, 39, 176, 0.1);
  color: #ba68c8;
}

.status-message {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  font-weight: 500;
}

.status-message.success {
  background: #d1f2d1;
  color: #1a7a1a;
}

.status-message.error {
  background: #ffd6d6;
  color: #c41c1c;
}

@media (max-width: 768px) {
  .pi-control-page {
    padding: 12px;
  }

  .page-header h1 {
    font-size: 28px;
  }

  .page-header .subtitle {
    font-size: 14px;
  }

  .info-card,
  .control-section,
  .speak-section,
  .logs-section {
    padding: 16px;
    border-radius: 16px;
  }

  .info-card h2,
  .control-section h2,
  .speak-section h2,
  .logs-section h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr; /* stack vertically */
    gap: 12px;
  }

  .info-item {
    padding: 12px;
  }

  .info-label {
    font-size: 13px;
  }

  .info-value {
    font-size: 15px;
  }

  .btn-refresh {
    width: 100%;
    padding: 12px;
    font-size: 15px;
  }
  
  .button-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .control-btn {
    padding: 14px 20px;
    font-size: 15px;
  }

  .btn-icon {
    font-size: 20px;
  }
  
  .speak-form {
    flex-direction: column;
    gap: 12px;
  }

  .speak-input {
    font-size: 15px;
    padding: 12px;
  }

  .btn-speak {
    width: 100%;
    padding: 12px 20px;
    font-size: 15px;
  }

  .logs-container {
    max-height: 250px;
    font-size: 12px;
  }
}
</style>
