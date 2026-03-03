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
          <span class="info-value">{{ uptimeDisplay || piInfo.uptimeThai || piInfo.uptime || 'ไม่ทราบ' }}</span>
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
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="info-value" :class="{ 'status-active': serviceStatus.isRunning, 'status-inactive': !serviceStatus.isRunning }">
              {{ serviceStatus.isRunning ? '🟢 ทำงานอยู่' : '🔴 หยุดทำงาน' }}
            </span>
            <span :title="wsConnected ? 'WebSocket: connected' : 'WebSocket: disconnected'" style="font-size:0.9rem;color:#6b6b70">
              {{ wsConnected ? 'WS: เชื่อมต่อ' : 'WS: ตัดการเชื่อมต่อ' }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="loading">
        <span>กำลังโหลด...</span>
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
      <div class="telegram-test-row">
        <button
          @click="captureAndSendTelegram"
          class="btn-capture-telegram"
          :disabled="loading || captureSending"
        >
          {{ captureSending ? '📸 กำลังถ่ายและ OCR...' : '📸 ถ่ายแล้วส่ง Telegram' }}
        </button>
        <button
          @click="testTelegramMessage"
          class="btn-telegram-test"
          :disabled="loading || telegramTesting"
        >
          {{ telegramTesting ? '⏳ กำลังส่ง...' : '📨 Test Telegram' }}
        </button>
      </div>
    </div>

    <!-- Telegram Chat Preview -->
    <div class="telegram-chat-section">
      <h2>💬 Telegram Chat Preview</h2>
      <div class="chat-phone-frame">
        <div class="chat-phone-header">
          <span class="chat-group-icon">👥</span>
          <div class="chat-group-info">
            <span class="chat-group-name">Parcel Noti</span>
            <span class="chat-group-status">{{ telegramWarning || `${telegramMessages.length} ข้อความ` }}</span>
          </div>
        </div>
        <div class="chat-messages-area" ref="chatMessagesArea">
          <div v-if="telegramChatLoading && telegramMessages.length === 0" class="chat-loading">
            กำลังโหลดข้อความ...
          </div>
          <div v-else-if="telegramMessages.length === 0" class="chat-empty">
            <p>📭 ยังไม่มีข้อความ</p>
            <p class="chat-empty-hint">ลองส่งข้อความทดสอบ หรือรอสักครู่</p>
          </div>
          <template v-else>
            <div
              v-for="msg in telegramMessages"
              :key="msg.id"
              class="chat-bubble-wrap"
              :class="isOutgoingMessage(msg) ? 'chat-bubble-outgoing' : 'chat-bubble-incoming'"
            >
              <div v-if="!isOutgoingMessage(msg)" class="chat-avatar">{{ getSenderInitial(msg.from?.name) }}</div>
              <div class="chat-bubble">
                <span v-if="!isOutgoingMessage(msg)" class="chat-sender">{{ msg.from?.name || 'Unknown' }}</span>
                <span v-if="msg.media" class="chat-attachment">{{ getMediaLabel(msg.media) }}</span>

                <img
                  v-if="msg.media && isImageMedia(msg.media)"
                  :src="msg.media.url"
                  class="chat-media-image"
                  alt="telegram media"
                  loading="lazy"
                />

                <video
                  v-else-if="msg.media && isVideoMedia(msg.media)"
                  :src="msg.media.url"
                  class="chat-media-video"
                  controls
                  preload="metadata"
                ></video>

                <audio
                  v-else-if="msg.media && isAudioMedia(msg.media)"
                  :src="msg.media.url"
                  class="chat-media-audio"
                  controls
                  preload="none"
                ></audio>

                <a
                  v-else-if="msg.media && isDocumentMedia(msg.media)"
                  :href="msg.media.url"
                  target="_blank"
                  rel="noopener"
                  class="chat-file-link"
                >
                  📄 {{ msg.media.fileName || 'เปิดไฟล์เอกสาร' }}
                </a>

                <div v-if="msg.location" class="chat-meta-box">
                  📍 {{ msg.location.latitude }}, {{ msg.location.longitude }}
                </div>

                <div v-if="msg.venue" class="chat-meta-box">
                  📌 {{ msg.venue.title }}<br />
                  <small>{{ msg.venue.address }}</small>
                </div>

                <div v-if="msg.contact" class="chat-meta-box">
                  👤 {{ [msg.contact.firstName, msg.contact.lastName].filter(Boolean).join(' ') || 'Contact' }}
                  <br />
                  <small>{{ msg.contact.phoneNumber }}</small>
                </div>

                <div v-if="msg.poll" class="chat-meta-box">
                  🗳️ {{ msg.poll.question }}
                </div>

                <p v-if="msg.text" class="chat-text">{{ msg.text }}</p>
                <p v-else-if="!msg.media && !msg.location && !msg.venue && !msg.contact && !msg.poll" class="chat-text">(ไม่มีข้อความ)</p>
                <span class="chat-time">{{ formatChatTime(msg.date) }}</span>
              </div>
            </div>
          </template>
        </div>
        <div class="chat-input-bar">
          <input
            v-model="chatInput"
            type="text"
            placeholder="พิมพ์ข้อความ..."
            @keyup.enter="sendChatMessage"
            :disabled="chatSending"
            class="chat-input"
          />
          <button @click="sendChatMessage" class="chat-send-btn" :disabled="chatSending || !chatInput.trim()">
            {{ chatSending ? '⏳' : '➤' }}
          </button>
        </div>
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

    <!-- Wi-Fi Config Section -->
    <div class="wifi-section">
      <h2>📶 ตั้งค่า Wi-Fi (Raspberry Pi)</h2>
      <p class="wifi-current">เครือข่ายปัจจุบัน: <strong>{{ currentNetworkStatus }}</strong></p>
      <p class="wifi-current" v-if="networkState.wifiConnected && networkState.lanConnected">
        สถานะ: เชื่อมทั้ง LAN และ Wi‑Fi
      </p>

      <!-- Wi-Fi Scanner -->
      <div class="wifi-scanner">
        <div class="wifi-scanner-header">
          <h3>เครือข่ายที่พบ <span v-if="scanning" class="scan-spinner-inline"></span></h3>
        </div>

        <div v-if="scanning && wifiNetworks.length === 0" class="wifi-scanning-indicator">
          <div class="scan-spinner"></div>
          <span>กำลังค้นหาเครือข่าย Wi-Fi...</span>
        </div>

        <div v-if="wifiNetworks.length > 0" class="wifi-list">
          <div
            v-for="network in wifiNetworks"
            :key="network.bssid || network.ssid"
            class="wifi-item"
            :class="{ 'wifi-item-active': network.inUse }"
            @click="onNetworkClick(network)"
          >
            <div class="wifi-item-left">
              <div class="wifi-signal-bars" :title="`สัญญาณ: ${network.signal}%`">
                <div class="signal-bar" :class="{ active: network.signal >= 10 }"></div>
                <div class="signal-bar" :class="{ active: network.signal >= 30 }"></div>
                <div class="signal-bar" :class="{ active: network.signal >= 55 }"></div>
                <div class="signal-bar" :class="{ active: network.signal >= 80 }"></div>
              </div>
              <div class="wifi-item-info">
                <span class="wifi-ssid">{{ network.ssid }}</span>
                <span class="wifi-detail">{{ network.security !== 'Open' ? '🔒' : '🔓' }} {{ network.security }} · {{ network.signal }}%</span>
              </div>
            </div>
            <div class="wifi-item-right">
              <span v-if="network.inUse" class="wifi-connected-badge">✓ เชื่อมต่ออยู่</span>
              <span v-else class="wifi-connect-hint">แตะเพื่อเชื่อมต่อ</span>
            </div>
          </div>
        </div>

        <div v-else-if="scanAttempted" class="wifi-no-results">
          <p>ไม่พบเครือข่าย Wi-Fi</p>
          <p class="wifi-no-hint">ลองกดสแกนอีกครั้ง</p>
        </div>
      </div>

      <!-- Connect Dialog (shown when clicking a network) -->
      <div v-if="connectDialog.show" class="wifi-connect-overlay" @click.self="closeConnectDialog">
        <div class="wifi-connect-dialog">
          <div class="dialog-header">
            <h3>เชื่อมต่อ "{{ connectDialog.ssid }}"</h3>
            <button class="dialog-close" @click="closeConnectDialog">✕</button>
          </div>
          <div class="dialog-body">
            <div class="dialog-network-info">
              <span>🔒 {{ connectDialog.security }}</span>
              <span>📶 สัญญาณ {{ connectDialog.signal }}%</span>
            </div>
            <div v-if="connectDialog.security !== 'Open'" class="dialog-password-field">
              <label>รหัสผ่าน Wi-Fi</label>
              <div class="password-input-wrap">
                <input
                  ref="connectPasswordInput"
                  v-model="connectDialog.password"
                  :type="connectDialog.showPassword ? 'text' : 'password'"
                  placeholder="ใส่รหัสผ่าน..."
                  @keyup.enter="connectToNetwork"
                  :disabled="connectDialog.connecting"
                />
                <button class="toggle-password" @click="connectDialog.showPassword = !connectDialog.showPassword">
                  {{ connectDialog.showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-dialog-cancel" @click="closeConnectDialog" :disabled="connectDialog.connecting">ยกเลิก</button>
            <button
              class="btn-dialog-connect"
              @click="connectToNetwork"
              :disabled="connectDialog.connecting || (connectDialog.security !== 'Open' && !connectDialog.password.trim())"
            >
              {{ connectDialog.connecting ? '🔄 กำลังเชื่อมต่อ...' : '📶 เชื่อมต่อ' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Manual Wi-Fi form (hidden behind toggle) -->
      <div class="wifi-manual-toggle">
        <button class="btn-manual-toggle" @click="showManualWifi = !showManualWifi">
          {{ showManualWifi ? '▲ ซ่อนฟอร์มกรอกเอง' : '▼ กรอก SSID เอง (เครือข่ายที่ซ่อน)' }}
        </button>
      </div>
      <div v-if="showManualWifi" class="wifi-form">
        <input
          v-model="wifiSsid"
          type="text"
          placeholder="ชื่อ Wi-Fi (SSID)"
          :disabled="loading"
        />
        <input
          v-model="wifiPassword"
          type="password"
          placeholder="รหัสผ่าน Wi-Fi"
          :disabled="loading"
        />
        <button
          @click="applyWifiConfig"
          class="btn-wifi"
          :disabled="loading || !wifiSsid.trim() || !wifiPassword.trim() || !wsConnected || !serviceStatus.isRunning"
        >
          💾 บันทึก Wi-Fi
        </button>
      </div>
      <p class="wifi-hint" v-if="!wsConnected || !serviceStatus.isRunning">
        ต้องอยู่ในสถานะ "ทำงานอยู่" และ "WS: เชื่อมต่อ" ก่อนจึงจะเปลี่ยน Wi-Fi ได้
      </p>
      <div class="network-switch" v-if="networkState.wifiConnected && networkState.lanConnected">
        <label for="prefer-network">เลือกเส้นทางใช้งาน:</label>
        <select id="prefer-network" v-model="preferredTarget" :disabled="isSwitchingNetwork || !wsConnected || !serviceStatus.isRunning" @change="switchPreferredNetwork">
          <option value="wifi">ใช้ Wi‑Fi ({{ networkState.wifiName || 'wlan0' }})</option>
          <option value="lan">ใช้ LAN ({{ networkState.lanName || 'eth0' }})</option>
        </select>
      </div>
    </div>

    <!-- GCP Credential Management -->
    <div class="credential-section">
      <h2>🔑 Google Cloud Credential</h2>
      <div class="credential-status" v-if="credentialInfo">
        <div class="credential-row">
          <span class="credential-label">📧 Service Account</span>
          <span class="credential-value">{{ credentialInfo.clientEmail || 'N/A' }}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">📁 Project</span>
          <span class="credential-value">{{ credentialInfo.projectId || 'N/A' }}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">🔑 Key ID</span>
          <span class="credential-value">{{ credentialInfo.keyId || 'N/A' }}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">📅 แก้ไขล่าสุด</span>
          <span class="credential-value">{{ credentialInfo.lastModified ? new Date(credentialInfo.lastModified).toLocaleString('th-TH') : 'N/A' }}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">✅ สถานะ API</span>
          <span class="credential-value" :class="{ 'api-valid': credentialInfo.apiValid, 'api-invalid': credentialInfo.apiValid === false }">
            {{ credentialInfo.apiValid === undefined ? '⏳ กำลังตรวจสอบ...' : credentialInfo.apiValid ? '✅ ใช้งานได้' : '❌ ใช้งานไม่ได้' }}
          </span>
        </div>
        <div v-if="credentialInfo.apiError" class="credential-error">
          ⚠️ {{ credentialInfo.apiError }}
        </div>
        <div v-if="credentialError" class="credential-error">
          ⚠️ {{ credentialError }}
        </div>
      </div>
      <div v-else class="loading">
        <span>กำลังโหลด...</span>
      </div>

      <div class="credential-upload">
        <div class="credential-help-wrap">
          <span class="credential-help-label">วิธีสร้าง Service Account / Key</span>
          <span class="credential-help-trigger" tabindex="0" aria-label="วิธีสร้าง Service Account และ JSON Key">?</span>
          <div class="credential-help-popover">
            <p><strong>ขั้นตอนสร้าง (Tenant Manager)</strong></p>
            <ol>
              <li>Service Accounts → Create service account</li>
              <li>ชื่อ: <strong>pi-ocr</strong> แล้วกด Create and continue</li>
              <li>Role: เลือก Cloud Vision (ถ้าไม่เจอให้ข้าม)</li>
              <li>Library → เปิด <strong>Cloud Vision API</strong></li>
              <li>กลับไป Service Accounts → pi-ocr → Keys</li>
              <li>Add Key → Create new key → JSON</li>
              <li>Copy JSON ทั้งไฟล์มาวางในช่องด้านล่าง แล้วกดอัปเดต</li>
            </ol>
          </div>
        </div>
        <p class="credential-hint">
          วาง JSON ของ Service Account Key ใหม่ที่นี่ (ดาวน์โหลดจาก
          <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener">Google Cloud Console</a>
          → เลือก Service Account → Keys → Add Key → JSON)
        </p>
        <textarea
          v-model="credentialJson"
          class="credential-textarea"
          placeholder='วาง JSON credential ที่นี่... { "type": "service_account", ... }'
          rows="6"
          :disabled="credentialUploading"
        ></textarea>
        <div class="credential-actions">
          <button
            @click="uploadCredential"
            class="btn-credential-upload"
            :disabled="credentialUploading || !credentialJson.trim()"
          >
            {{ credentialUploading ? '🔄 กำลังอัปโหลด...' : '⬆️ อัปเดต Credential' }}
          </button>
          <button
            @click="clearInbox"
            class="btn-clear-inbox"
            :disabled="credentialUploading"
          >
            🗑️ ล้างรูปค้าง
          </button>
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
              'log-system-error': log.source === 'system',
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
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { piAPI } from '../api.js';
import { useDialog } from '../composables/useDialog.js';
import { WS_URL } from '../config.js';

const { confirm: showConfirm, alert: showAlert } = useDialog();
const route = useRoute();

let ws = null; // WebSocket instance
// Uptime local tracking (compute seconds on frontend when backend doesn't provide seconds)
const uptimeBaseSeconds = ref(null); // base seconds parsed from last message
const uptimeLastReceivedAt = ref(null);
const uptimeDisplay = ref('');

function parseUptimeToSeconds(uptimeStr) {
  if (!uptimeStr) return null;
  // examples: "16 hours, 37 minutes", "1 day, 3 hours, 12 minutes"
  const parts = uptimeStr.split(',').map(p => p.trim().toLowerCase());
  let seconds = 0;
  parts.forEach(part => {
    const hMatch = part.match(/(\d+)\s*hour/);
    const mMatch = part.match(/(\d+)\s*minute/);
    const dMatch = part.match(/(\d+)\s*day/);
    const sMatch = part.match(/(\d+)\s*second/);
    if (dMatch) seconds += parseInt(dMatch[1], 10) * 86400;
    if (hMatch) seconds += parseInt(hMatch[1], 10) * 3600;
    if (mMatch) seconds += parseInt(mMatch[1], 10) * 60;
    if (sMatch) seconds += parseInt(sMatch[1], 10);
  });
  return seconds || null;
}

function formatSecondsToThai(sec) {
  if (sec == null) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const parts = [];
  if (h) parts.push(`${h} ชั่วโมง`);
  if (m) parts.push(`${m} นาที`);
  if (s || parts.length === 0) parts.push(`${s} วินาที`);
  return parts.join(' ');
}

function updateUptimeDisplay() {
  if (uptimeBaseSeconds.value === null || uptimeLastReceivedAt.value === null) return;
  const elapsed = Math.floor((Date.now() - uptimeLastReceivedAt.value) / 1000);
  const total = uptimeBaseSeconds.value + elapsed;
  uptimeDisplay.value = formatSecondsToThai(total);
}

function connectWebSocket() {
  if (ws) {
    ws.close();
  }
  ws = new WebSocket(WS_URL);
  ws.onopen = () => {
    console.log('[WebSocket] Connected to server (PiControl)');
    wsConnected.value = true;
  };
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'pi-info') {
        // Update piInfo and serviceStatus based on broadcast
        if (message.data && message.data.success) {
          piInfo.value = {
            uptime: message.data.uptime,
            uptimeThai: message.data.uptimeThai,
            uptimeSeconds: message.data.uptimeSeconds,
            cpuTemp: message.data.cpuTemp,
            memoryDisplay: message.data.memoryDisplay,
            memoryUsage: message.data.memoryUsage
          };
          serviceStatus.value = { status: message.data.status, isRunning: message.data.isRunning };

          // If uptimeSeconds provided by backend, use it; otherwise parse from uptime string
          if (message.data.uptimeSeconds && message.data.uptimeSeconds > 0) {
            uptimeBaseSeconds.value = message.data.uptimeSeconds;
            uptimeLastReceivedAt.value = Date.now();
          } else {
            const parsed = parseUptimeToSeconds(message.data.uptime || '');
            if (parsed) {
              uptimeBaseSeconds.value = parsed;
              uptimeLastReceivedAt.value = Date.now();
            }
          }

          // Update display immediately
          updateUptimeDisplay();

          // Also store full piInfo (already done) — keeps template consistent

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
    wsConnected.value = false;
    setTimeout(connectWebSocket, 3000);
  };
  ws.onerror = (err) => {
    console.error('[WebSocket] Error (PiControl):', err);
    wsConnected.value = false;
  };
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
const wifiSsid = ref('');
const wifiPassword = ref('');
const currentNetworkStatus = ref('ไม่พบการเชื่อมต่อ');
const preferredTarget = ref('wifi');
const networkState = ref({
  wifiConnected: false,
  lanConnected: false,
  connectionType: 'none',
  wifiName: '',
  lanName: '',
});
const showManualWifi = ref(false);
const scanning = ref(false);
const scanAttempted = ref(false);
const wifiNetworks = ref([]);
const connectPasswordInput = ref(null);
const isSwitchingNetwork = ref(false);
const connectDialog = ref({
  show: false,
  ssid: '',
  security: '',
  signal: 0,
  password: '',
  showPassword: false,
  connecting: false,
});

// Credential management
const credentialInfo = ref(null);
const credentialError = ref('');
const credentialJson = ref('');
const credentialUploading = ref(false);
const telegramTesting = ref(false);
const captureSending = ref(false);

// Telegram Chat Preview
const telegramMessages = ref([]);
const telegramChatLoading = ref(false);
const chatInput = ref('');
const chatSending = ref(false);
const chatMessagesArea = ref(null);
const telegramWarning = ref('');
const selfUserName = ref(localStorage.getItem('telegram_self_name') || '');
let chatPollInterval = null;

let uptimeTicker = null; // interval id for uptime updates
let wifiScanInterval = null; // interval id for auto wifi scan
const wsConnected = ref(false);

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

    // Update uptime display immediately from API response
    if (info) {
      if (info.uptimeSeconds && info.uptimeSeconds > 0) {
        uptimeBaseSeconds.value = info.uptimeSeconds;
        uptimeLastReceivedAt.value = Date.now();
      } else if (info.uptime) {
        const parsed = parseUptimeToSeconds(info.uptime);
        if (parsed) {
          uptimeBaseSeconds.value = parsed;
          uptimeLastReceivedAt.value = Date.now();
        }
      }
      updateUptimeDisplay();
    }
  } catch (err) {
    console.error('Error refreshing info:', err);
    showMessage('ไม่สามารถเชื่อมต่อกับ Pi ได้: ' + err.message, 'error');
  } finally {
    loading.value = false;
  }
};

// Credential management
const loadCredentialStatus = async () => {
  try {
    const data = await piAPI.getCredentialStatus();
    credentialInfo.value = data;
    if (data.apiValid === false) {
      credentialError.value = 'Credential ไม่ถูกต้องหรือหมดอายุ — กรุณาอัปเดต Key ใหม่';
    } else {
      credentialError.value = '';
    }
  } catch (err) {
    console.error('Error loading credential status:', err);
    credentialInfo.value = { exists: false, apiValid: false };
    credentialError.value = 'ไม่สามารถตรวจสอบ credential ได้';
  }
};

const uploadCredential = async () => {
  if (!credentialJson.value.trim()) return;
  credentialUploading.value = true;
  try {
    const result = await piAPI.uploadCredential(credentialJson.value.trim());
    showMessage(`✅ อัปเดต Credential สำเร็จ (${result.clientEmail}) — สถานะ: ${result.serviceStatus}`, 'success');
    credentialJson.value = '';
    credentialError.value = '';
    // Reload credential info
    await loadCredentialStatus();
    // Refresh logs to see new state
    setTimeout(() => refreshLogs(), 3000);
  } catch (err) {
    showMessage('❌ อัปเดต Credential ล้มเหลว: ' + (err.message || err), 'error');
  } finally {
    credentialUploading.value = false;
  }
};

const clearInbox = async () => {
  try {
    const result = await piAPI.clearInbox();
    showMessage(`🗑️ ล้างรูปค้างแล้ว ${result.cleared} รูป`, 'success');
  } catch (err) {
    showMessage('❌ ล้างรูปค้างล้มเหลว: ' + (err.message || err), 'error');
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

const testTelegramMessage = async () => {
  telegramTesting.value = true;
  try {
    await piAPI.testTelegram(`🧪 Test Telegram จากหน้าเว็บ Tenant Manager (${new Date().toLocaleString('th-TH')})`);
    showMessage('ส่งข้อความทดสอบ Telegram สำเร็จ', 'success');
    setTimeout(refreshLogs, 300);
  } catch (err) {
    showMessage('ส่งข้อความทดสอบ Telegram ไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    telegramTesting.value = false;
  }
};

const captureAndSendTelegram = async () => {
  captureSending.value = true;
  try {
    const result = await piAPI.captureAndSendTelegram();
    showMessage(result.message || 'ถ่ายภาพและส่ง Telegram สำเร็จ', 'success');
    setTimeout(refreshLogs, 400);
    // Refresh chat after capture sends a telegram message
    setTimeout(() => loadTelegramMessages(true), 1500);
  } catch (err) {
    const retryMessage = err.message?.includes('กดถ่ายใหม่')
      ? err.message
      : `OCR ไม่สำเร็จ กรุณากดถ่ายใหม่ (${err.message || 'Unknown error'})`;
    showMessage(retryMessage, 'error');
    await showAlert(retryMessage, 'ถ่ายไม่สำเร็จ');
  } finally {
    captureSending.value = false;
  }
};

// ─── Telegram Chat Preview ───────────────────────────────────
const formatChatTime = (unixTimestamp) => {
  if (!unixTimestamp) return '';
  const d = new Date(unixTimestamp * 1000);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const isImageMedia = (media) => ['photo', 'sticker', 'animation'].includes(media?.kind);
const isVideoMedia = (media) => ['video'].includes(media?.kind);
const isAudioMedia = (media) => ['audio', 'voice'].includes(media?.kind);
const isDocumentMedia = (media) => ['document'].includes(media?.kind);

const getMediaLabel = (media) => {
  if (!media?.kind) return '';
  if (media.kind === 'photo') return '📷 รูปภาพ';
  if (media.kind === 'video') return '🎬 วิดีโอ';
  if (media.kind === 'animation') return '🎞️ GIF/Animation';
  if (media.kind === 'sticker') return `🧩 สติ๊กเกอร์ ${media.emoji || ''}`.trim();
  if (media.kind === 'voice') return '🎤 ข้อความเสียง';
  if (media.kind === 'audio') return '🎵 เสียง';
  if (media.kind === 'document') return '📎 เอกสาร';
  return `📦 ${media.kind}`;
};

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const isOutgoingMessage = (msg) => {
  if (msg?.isOutgoing) return true;
  if (!msg?.from || msg.from.isBot) return false;
  if (!selfUserName.value) return false;
  return normalizeName(msg.from.name) === normalizeName(selfUserName.value)
    || normalizeName(msg.from.username) === normalizeName(selfUserName.value);
};

const getSenderInitial = (name) => {
  const cleaned = String(name || '').trim();
  if (!cleaned) return 'U';
  return cleaned.charAt(0).toUpperCase();
};

const scrollChatToBottom = () => {
  nextTick(() => {
    if (chatMessagesArea.value) {
      chatMessagesArea.value.scrollTop = chatMessagesArea.value.scrollHeight;
    }
  });
};

const loadTelegramMessages = async (force = false) => {
  try {
    telegramChatLoading.value = true;
    const result = await piAPI.getTelegramMessages(force);
    if (result.success) {
      telegramWarning.value = result.warningMessage || '';
      const prevLen = telegramMessages.value.length;
      telegramMessages.value = result.messages || [];
      if (force && result.warningMessage) {
        showMessage(`⚠️ ${result.warningMessage}`, 'error');
      }
      if (force || telegramMessages.value.length > prevLen) {
        scrollChatToBottom();
      }
    }
  } catch (err) {
    console.error('Error loading Telegram messages:', err);
  } finally {
    telegramChatLoading.value = false;
  }
};

const sendChatMessage = async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  chatSending.value = true;
  try {
    if (!selfUserName.value) {
      selfUserName.value = 'You';
      localStorage.setItem('telegram_self_name', selfUserName.value);
    }

    telegramMessages.value.push({
      id: `local-${Date.now()}`,
      from: { name: selfUserName.value, username: '', isBot: false },
      text,
      date: Math.floor(Date.now() / 1000),
      media: null,
      location: null,
      venue: null,
      contact: null,
      poll: null,
      isOutgoing: true,
    });
    scrollChatToBottom();

    await piAPI.sendTelegramMessage(text);
    chatInput.value = '';
    // Refresh messages to show the sent message
    await loadTelegramMessages(true);
    scrollChatToBottom();
  } catch (err) {
    showMessage('ส่งข้อความไม่สำเร็จ: ' + err.message, 'error');
  } finally {
    chatSending.value = false;
  }
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

const loadWifiStatus = async () => {
  try {
    const response = await piAPI.getWifiStatus();
    networkState.value = {
      wifiConnected: Boolean(response.wifiConnected),
      lanConnected: Boolean(response.lanConnected),
      connectionType: response.connectionType || 'none',
      wifiName: response.wifiName || response.ssid || '',
      lanName: response.lanName || '',
    };

    if (response.connectionType === 'lan' || (response.lanConnected && !response.wifiConnected)) {
      currentNetworkStatus.value = 'ต่อ LAN อยู่';
      preferredTarget.value = 'lan';
      return;
    }
    if (response.connectionType === 'wifi' || response.wifiConnected) {
      const wifiName = response.wifiName || response.ssid || response.connectionName || 'Wi-Fi';
      currentNetworkStatus.value = `Wi-Fi: ${wifiName}`;
      preferredTarget.value = 'wifi';
      return;
    }
    currentNetworkStatus.value = 'ไม่พบการเชื่อมต่อ';
  } catch (err) {
    console.error('Error loading Wi-Fi status:', err);
    currentNetworkStatus.value = 'ไม่พบการเชื่อมต่อ';
  }
};

const applyPreferredTargetToUI = (target) => {
  networkState.value = {
    ...networkState.value,
    connectionType: target,
  };

  if (target === 'lan') {
    currentNetworkStatus.value = 'ต่อ LAN อยู่';
    preferredTarget.value = 'lan';
  } else {
    const wifiName = networkState.value.wifiName || 'Wi-Fi';
    currentNetworkStatus.value = `Wi-Fi: ${wifiName}`;
    preferredTarget.value = 'wifi';
  }

  wifiNetworks.value = wifiNetworks.value.map((network) => {
    const isActiveWifi = target === 'wifi' && network.ssid === networkState.value.wifiName;
    return {
      ...network,
      inUse: isActiveWifi,
    };
  });
};

const applyWifiConfig = async () => {
  if (!wifiSsid.value.trim() || !wifiPassword.value.trim()) return;

  const confirmed = await showConfirm(
    `ยืนยันเปลี่ยน Wi-Fi เป็น "${wifiSsid.value}"?\nการเชื่อมต่ออาจหลุดชั่วคราว`,
    'ยืนยันการเปลี่ยน Wi-Fi'
  );
  if (!confirmed) return;

  loading.value = true;
  try {
    const result = await piAPI.setWifiConfig(wifiSsid.value.trim(), wifiPassword.value);
    const connectedSsid = result.ssid || wifiSsid.value.trim();
    showMessage(`เชื่อม Wi‑Fi สำเร็จ: ${connectedSsid}`, 'success');
    await showAlert(`เชื่อม Wi‑Fi สำเร็จ\nเครือข่าย: ${connectedSsid}`, 'สำเร็จ');
    currentNetworkStatus.value = `Wi-Fi: ${connectedSsid}`;
    wifiPassword.value = '';
    setTimeout(loadWifiStatus, 1500);
  } catch (err) {
    const errorMessage = 'ไม่สามารถเปลี่ยน Wi-Fi ได้: ' + err.message;
    showMessage(errorMessage, 'error');
    await showAlert(errorMessage, 'เชื่อม Wi‑Fi ไม่สำเร็จ');
  } finally {
    loading.value = false;
  }
};

const switchPreferredNetwork = async () => {
  if (isSwitchingNetwork.value) return;

  const previousTarget = networkState.value.connectionType === 'wifi' ? 'wifi' : 'lan';
  const targetText = preferredTarget.value === 'wifi' ? 'Wi‑Fi' : 'LAN';

  isSwitchingNetwork.value = true;
  loading.value = true;
  try {
    await piAPI.switchPreferredNetwork(preferredTarget.value);
    applyPreferredTargetToUI(preferredTarget.value);
    showMessage(`สลับเส้นทางเป็น ${targetText} สำเร็จ`, 'success');

    // Re-sync from backend without forcing page refresh
    setTimeout(() => {
      loadWifiStatus();
      scanWifiNetworks();
    }, 300);
  } catch (err) {
    preferredTarget.value = previousTarget;
    applyPreferredTargetToUI(previousTarget);
    showMessage('ไม่สามารถสลับเส้นทางได้: ' + err.message, 'error');
  } finally {
    isSwitchingNetwork.value = false;
    loading.value = false;
  }
};

// ── Wi-Fi Scanner ──────────────────────────────────────────────
const scanWifiNetworks = async () => {
  if (route.path !== '/pi') return;

  scanning.value = true;
  scanAttempted.value = false;
  try {
    const result = await piAPI.scanWifi();
    wifiNetworks.value = result.networks || [];
    scanAttempted.value = true;
  } catch (err) {
    showMessage('สแกน Wi-Fi ไม่สำเร็จ: ' + err.message, 'error');
    scanAttempted.value = true;
  } finally {
    scanning.value = false;
  }
};

const onNetworkClick = (network) => {
  if (network.inUse) return; // already connected
  connectDialog.value = {
    show: true,
    ssid: network.ssid,
    security: network.security,
    signal: network.signal,
    password: '',
    showPassword: false,
    connecting: false,
  };
  nextTick(() => {
    if (connectPasswordInput.value) connectPasswordInput.value.focus();
  });
};

const closeConnectDialog = () => {
  if (connectDialog.value.connecting) return;
  connectDialog.value.show = false;
};

const connectToNetwork = async () => {
  const d = connectDialog.value;
  if (d.connecting) return;
  if (d.security !== 'Open' && !d.password.trim()) return;

  d.connecting = true;
  try {
    const result = await piAPI.setWifiConfig(d.ssid, d.password || '');
    const connectedSsid = result.ssid || d.ssid;
    d.show = false;
    showMessage(`เชื่อม Wi‑Fi สำเร็จ: ${connectedSsid}`, 'success');
    await showAlert(`เชื่อม Wi‑Fi สำเร็จ\nเครือข่าย: ${connectedSsid}`, 'สำเร็จ');
    // Refresh scan list & status
    setTimeout(() => {
      loadWifiStatus();
      scanWifiNetworks();
    }, 1500);
  } catch (err) {
    const errorMessage = 'เชื่อม Wi‑Fi ไม่สำเร็จ: ' + err.message;
    showMessage(errorMessage, 'error');
    await showAlert(errorMessage, 'เชื่อม Wi‑Fi ไม่สำเร็จ');
  } finally {
    d.connecting = false;
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
  loadWifiStatus();
  loadCredentialStatus();
  loadTelegramMessages(true);
  if (route.path === '/pi') {
    scanWifiNetworks();
  }

  // Auto-scan Wi-Fi every 5 seconds only on /pi
  if (route.path === '/pi') {
    wifiScanInterval = setInterval(scanWifiNetworks, 5000);
  }

  // Poll Telegram chat every 5 seconds
  chatPollInterval = setInterval(loadTelegramMessages, 5000);

  watch(
    () => route.path,
    (newPath) => {
      if (newPath === '/pi') {
        scanWifiNetworks();
        if (!wifiScanInterval) {
          wifiScanInterval = setInterval(scanWifiNetworks, 5000);
        }
        return;
      }

      if (wifiScanInterval) {
        clearInterval(wifiScanInterval);
        wifiScanInterval = null;
      }
    }
  );

  // Start uptime ticker (update every second)
  uptimeTicker = setInterval(updateUptimeDisplay, 1000);

  // Connect WebSocket
  connectWebSocket();
});

onUnmounted(() => {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (uptimeTicker) {
    clearInterval(uptimeTicker);
    uptimeTicker = null;
  }
  if (wifiScanInterval) {
    clearInterval(wifiScanInterval);
    wifiScanInterval = null;
  }
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }
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

/* Control buttons were removed per request. Styles kept minimal. */

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

.telegram-test-row {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-capture-telegram {
  background: #34c759;
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-capture-telegram:hover:not(:disabled) {
  background: #2ea94f;
}

.btn-capture-telegram:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-telegram-test {
  background: #229ed9;
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-telegram-test:hover:not(:disabled) {
  background: #178bc0;
}

.btn-telegram-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Telegram Chat Preview ───────────────────────────────────── */
.telegram-chat-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.telegram-chat-section h2 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #1d1d1f;
  font-size: 1.3rem;
}

.chat-phone-frame {
  border: 1px solid #e5e5ea;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 520px;
  background: #15192a;
}

.chat-phone-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(180deg, #2c3149 0%, #24283c 100%);
  color: #fff;
  flex-shrink: 0;
}

.chat-group-icon {
  font-size: 1.5rem;
  background: rgba(255,255,255,0.2);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-group-name {
  font-weight: 600;
  font-size: 1rem;
}

.chat-group-status {
  font-size: 0.75rem;
  opacity: 0.85;
  color: #b9bfd6;
}

.chat-refresh-btn {
  background: rgba(255,255,255,0.18);
  border: none;
  color: #fff;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.chat-refresh-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.3);
}

.chat-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spin-icon {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 200px;
  max-height: 380px;
  background: #111426 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23353b5d' stroke-opacity='.3'%3E%3Ccircle cx='12' cy='12' r='4'/%3E%3Ccircle cx='60' cy='24' r='5'/%3E%3Cpath d='M24 56c8-6 16-6 24 0'/%3E%3Cpath d='M8 44h10'/%3E%3Cpath d='M66 56h8'/%3E%3C/g%3E%3C/svg%3E");
}

.chat-loading,
.chat-empty {
  text-align: center;
  padding: 40px 16px;
  color: #aeb4cb;
}

.chat-empty-hint {
  font-size: 0.8rem;
  margin-top: 4px;
  opacity: 0.7;
}

.chat-bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chat-bubble-incoming {
  justify-content: flex-start;
}

.chat-bubble-outgoing {
  justify-content: flex-end;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #5d76ff;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
  word-break: break-word;
  box-shadow: 0 1px 1px rgba(0,0,0,0.08);
}

.chat-bubble-incoming .chat-bubble {
  background: #2b2340;
  border-bottom-left-radius: 4px;
  color: #f3f0ff;
}

.chat-bubble-outgoing .chat-bubble {
  background: #3c63ff;
  border-bottom-right-radius: 4px;
  color: #fff;
}

.chat-sender {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #d7c9ff;
  margin-bottom: 2px;
}

.chat-attachment {
  display: inline-block;
  font-size: 0.8rem;
  color: #d8d7df;
  margin-bottom: 2px;
}

.chat-media-image,
.chat-media-video {
  width: 100%;
  max-width: 260px;
  border-radius: 10px;
  margin: 6px 0;
  display: block;
  background: #f2f2f7;
}

.chat-media-audio {
  width: 100%;
  max-width: 260px;
  margin: 6px 0;
}

.chat-file-link {
  display: inline-block;
  margin: 6px 0;
  padding: 6px 10px;
  border-radius: 10px;
  background: #f2f2f7;
  color: #1d1d1f;
  text-decoration: none;
  font-size: 0.84rem;
}

.chat-file-link:hover {
  text-decoration: underline;
}

.chat-meta-box {
  margin: 6px 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 0.82rem;
  line-height: 1.35;
}

.chat-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: inherit;
  white-space: pre-wrap;
}

.chat-time {
  display: block;
  text-align: right;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 2px;
}

.chat-input-bar {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #f0f0f0;
  border-top: 1px solid #d1d1d6;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  border: 1px solid #d1d1d6;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.9rem;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: #229ed9;
}

.chat-send-btn {
  background: #229ed9;
  color: #fff;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}

.chat-send-btn:hover:not(:disabled) {
  background: #178bc0;
}

.chat-send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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

.wifi-section {
  background: white;
  border-radius: 18px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.wifi-section h2 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #1d1d1f;
  font-size: 1.3rem;
}

.wifi-current {
  margin: 0 0 12px;
  color: #6b6b70;
  font-size: 0.95rem;
}

.wifi-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: center;
}

.wifi-form input {
  padding: 12px 14px;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
}

.wifi-form input:focus {
  border-color: #007aff;
}

.btn-wifi {
  background: #007aff;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-wifi:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wifi-hint {
  margin-top: 10px;
  color: #8a6d3b;
  font-size: 0.9rem;
}

.network-switch {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.network-switch label {
  color: #6b6b70;
  font-size: 0.92rem;
}

.network-switch select {
  padding: 10px 12px;
  border: 1px solid #d2d2d7;
  border-radius: 10px;
  background: white;
  color: #1d1d1f;
  transition: opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.network-switch select:disabled {
  opacity: 0.45;
  background: #f2f2f5;
  color: #8e8e93;
  cursor: not-allowed;
}

.btn-switch-network {
  background: #34c759;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-switch-network:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Wi-Fi Scanner ────────────────────────────── */
.wifi-scanner {
  margin-top: 16px;
  margin-bottom: 16px;
}

.wifi-scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.wifi-scanner-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: #1d1d1f;
}

.btn-scan {
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-scan:hover:not(:disabled) {
  background: #0056b3;
}

.btn-scan:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.scan-spinner-inline {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #d2d2d7;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
  margin-left: 6px;
}

.wifi-scanning-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  color: #86868b;
  font-size: 0.95rem;
}

.scan-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid #e0e0e0;
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.wifi-list {
  border: 1px solid #e8e8ed;
  border-radius: 12px;
  overflow: hidden;
}

.wifi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f5;
  cursor: pointer;
  transition: background 0.15s;
}

.wifi-item:last-child {
  border-bottom: none;
}

.wifi-item:hover {
  background: #f5f5f7;
}

.wifi-item-active {
  background: #e8f5e9;
}

.wifi-item-active:hover {
  background: #d8efd9;
  cursor: default;
}

.wifi-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wifi-signal-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 20px;
  width: 22px;
}

.signal-bar {
  width: 4px;
  border-radius: 1px;
  background: #d2d2d7;
  transition: background 0.2s;
}

.signal-bar:nth-child(1) { height: 5px; }
.signal-bar:nth-child(2) { height: 9px; }
.signal-bar:nth-child(3) { height: 14px; }
.signal-bar:nth-child(4) { height: 20px; }

.signal-bar.active { background: #007aff; }
.wifi-item-active .signal-bar.active { background: #34c759; }

.wifi-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wifi-ssid {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1d1d1f;
}

.wifi-detail {
  font-size: 0.8rem;
  color: #86868b;
}

.wifi-item-right {
  flex-shrink: 0;
}

.wifi-connected-badge {
  color: #34c759;
  font-weight: 600;
  font-size: 0.85rem;
}

.wifi-connect-hint {
  color: #007aff;
  font-size: 0.85rem;
}

.wifi-no-results {
  text-align: center;
  padding: 24px;
  color: #86868b;
}

.wifi-no-hint {
  font-size: 0.85rem;
  color: #aaa;
}

/* Connect Dialog (overlay) */
.wifi-connect-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.wifi-connect-dialog {
  background: #fff;
  border-radius: 18px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1d1d1f;
}

.dialog-close {
  background: #f5f5f7;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b6b70;
}

.dialog-close:hover {
  background: #e8e8ed;
}

.dialog-body {
  padding: 0 24px 16px;
}

.dialog-network-info {
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: #6b6b70;
  margin-bottom: 16px;
}

.dialog-password-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-password-field label {
  font-size: 0.9rem;
  color: #6b6b70;
}

.password-input-wrap {
  display: flex;
  border: 1px solid #d2d2d7;
  border-radius: 12px;
  overflow: hidden;
}

.password-input-wrap input {
  flex: 1;
  border: none;
  padding: 12px 14px;
  font-size: 1rem;
  outline: none;
}

.toggle-password {
  background: transparent;
  border: none;
  padding: 0 12px;
  cursor: pointer;
  font-size: 1rem;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  padding: 0 24px 20px;
  justify-content: flex-end;
}

.btn-dialog-cancel {
  background: #f5f5f7;
  color: #1d1d1f;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
}

.btn-dialog-cancel:hover:not(:disabled) {
  background: #e8e8ed;
}

.btn-dialog-connect {
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
}

.btn-dialog-connect:hover:not(:disabled) {
  background: #0056b3;
}

.btn-dialog-connect:disabled,
.btn-dialog-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Manual Wi-Fi toggle */
.wifi-manual-toggle {
  margin-top: 12px;
  margin-bottom: 8px;
}

.btn-manual-toggle {
  background: none;
  border: none;
  color: #007aff;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 4px 0;
}

.btn-manual-toggle:hover {
  text-decoration: underline;
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

.log-system-error {
  background: rgba(255, 59, 48, 0.16);
  color: #ff6b6b;
  border-left: 3px solid #ff3b30;
  padding-left: 10px;
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
  .wifi-section,
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

  .wifi-form {
    grid-template-columns: 1fr;
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

/* Credential Section */
.credential-section {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-top: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.credential-section h2 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1d1d1f;
}
.credential-status {
  background: #f5f5f7;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.credential-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #e5e5ea;
}
.credential-row:last-of-type {
  border-bottom: none;
}
.credential-label {
  font-size: 0.85rem;
  color: #6e6e73;
  font-weight: 500;
}
.credential-value {
  font-size: 0.85rem;
  color: #1d1d1f;
  font-family: 'SF Mono', 'Menlo', monospace;
  word-break: break-all;
  max-width: 60%;
  text-align: right;
}
.credential-error {
  margin-top: 10px;
  padding: 10px 14px;
  background: #fff3f3;
  border: 1px solid #ffcccb;
  border-radius: 10px;
  color: #d32f2f;
  font-size: 0.85rem;
  font-weight: 500;
}
.api-valid {
  color: #34c759 !important;
  font-weight: 700;
}
.api-invalid {
  color: #ff3b30 !important;
  font-weight: 700;
}
.credential-upload {
  margin-top: 12px;
}
.credential-help-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  margin-bottom: 8px;
}
.credential-help-label {
  font-size: 0.82rem;
  color: #6e6e73;
  font-weight: 600;
}
.credential-help-trigger {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #007aff;
  cursor: help;
  user-select: none;
}
.credential-help-popover {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  width: min(420px, 88vw);
  background: #1d1d1f;
  color: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: all 0.18s ease;
  z-index: 30;
}
.credential-help-popover p {
  margin: 0 0 8px;
  font-size: 0.82rem;
}
.credential-help-popover ol {
  margin: 0;
  padding-left: 18px;
  font-size: 0.78rem;
  line-height: 1.45;
}
.credential-help-wrap:hover .credential-help-popover,
.credential-help-wrap:focus-within .credential-help-popover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.credential-hint {
  font-size: 0.82rem;
  color: #8e8e93;
  margin-bottom: 10px;
  line-height: 1.5;
}
.credential-hint a {
  color: #007aff;
  text-decoration: none;
}
.credential-hint a:hover {
  text-decoration: underline;
}
.credential-textarea {
  width: 100%;
  border: 1px solid #d1d1d6;
  border-radius: 10px;
  padding: 12px 14px;
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 0.78rem;
  resize: vertical;
  background: #fafafa;
  color: #1d1d1f;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.credential-textarea:focus {
  outline: none;
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0,122,255,0.12);
}
.credential-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.credential-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.btn-credential-upload {
  padding: 10px 20px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.btn-credential-upload:hover:not(:disabled) {
  background: #0056cc;
}
.btn-credential-upload:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn-clear-inbox {
  padding: 10px 20px;
  background: #f5f5f7;
  color: #ff3b30;
  border: 1px solid #e5e5ea;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.btn-clear-inbox:hover:not(:disabled) {
  background: #fff0f0;
}
.btn-clear-inbox:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
