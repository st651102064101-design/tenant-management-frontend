<template>
  <div class="settings-page">
    <!-- Large Title -->
    <div class="settings-nav">
      <h1 class="settings-large-title">Raspberry Pi</h1>
      <p class="settings-subtitle">ควบคุมระบบ OCR บน Raspberry Pi</p>
    </div>

    <!-- ─── System Info ─── -->
    <div class="settings-group">
      <div class="settings-group-label">ข้อมูลระบบ</div>
      <div class="settings-list" v-if="piInfo">
        <div class="settings-row">
          <div class="row-icon orange"><span>⏱</span></div>
          <div class="row-body">
            <span class="row-title">เวลาทำงาน</span>
          </div>
          <span class="row-detail">{{ uptimeDisplay || piInfo.uptimeThai || piInfo.uptime || 'ไม่ทราบ' }}</span>
        </div>
        <div class="settings-row">
          <div class="row-icon red"><span>🌡</span></div>
          <div class="row-body">
            <span class="row-title">อุณหภูมิ CPU</span>
          </div>
          <span class="row-detail">{{ piInfo.cpuTemp || 'N/A' }}</span>
        </div>
        <div class="settings-row">
          <div class="row-icon purple"><span>💾</span></div>
          <div class="row-body">
            <span class="row-title">หน่วยความจำ</span>
            <span class="row-sub" :title="formatMemoryTooltip(piInfo)">{{ piInfo.memoryDisplay || 'N/A' }}</span>
            <span v-if="piInfo && piInfo.memoryUsage" class="row-sub">{{ piInfo.memoryUsage.mb }} · {{ piInfo.memoryUsage.kb }}</span>
          </div>
          <span class="row-detail"></span>
        </div>
        <div class="settings-row">
          <div class="row-icon green"><span>📡</span></div>
          <div class="row-body">
            <span class="row-title">สถานะบริการ OCR</span>
            <span class="row-sub">{{ wsConnected ? 'WS: เชื่อมต่อ' : 'WS: ตัดการเชื่อมต่อ' }}</span>
          </div>
          <span class="row-detail" :class="serviceStatus.isRunning ? 'detail-on' : 'detail-off'">
            {{ serviceStatus.isRunning ? 'ทำงานอยู่' : 'หยุดทำงาน' }}
          </span>
        </div>
      </div>
      <div v-else class="settings-list">
        <div class="settings-row-empty">กำลังโหลด...</div>
      </div>
    </div>

    <!-- ─── Speak ─── -->
    <div class="settings-group">
      <div class="settings-group-label">พูดข้อความ</div>
      <div class="settings-list">
        <div class="settings-input-row">
          <input 
            v-model="speakText" 
            type="text" 
            placeholder="พิมพ์ข้อความที่ต้องการให้ Pi พูด..."
            @keyup.enter="speakOnPi"
            :disabled="loading"
          />
          <button @click="speakOnPi" class="input-btn-primary" :disabled="loading || !speakText.trim()">
            พูด
          </button>
        </div>
        <div class="settings-chips-row">
          <span class="chips-label">พูดด่วน</span>
          <button @click="quickSpeak('สวัสดี')" class="chip">สวัสดี</button>
          <button @click="quickSpeak('มีพัสดุมาส่ง')" class="chip">มีพัสดุมาส่ง</button>
          <button @click="quickSpeak('พร้อมถ่ายแล้ว')" class="chip">พร้อมถ่ายแล้ว</button>
          <button @click="quickSpeak('ขอบคุณครับ')" class="chip">ขอบคุณครับ</button>
        </div>
        <div class="settings-actions-row">
          <button
            @click="captureAndSendTelegram"
            class="action-btn green-btn"
            :disabled="loading || captureSending"
          >
            {{ captureSending ? '📸 กำลังถ่ายและ OCR...' : '📸 ถ่ายแล้วส่ง Telegram' }}
          </button>
          <button
            @click="testTelegramMessage"
            class="action-btn blue-btn"
            :disabled="loading || telegramTesting"
          >
            {{ telegramTesting ? '⏳ กำลังส่ง...' : '📨 Test Telegram' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Telegram Chat ─── -->
    <div class="settings-group">
      <div class="settings-group-label">Telegram Chat</div>
      <div class="settings-list no-padding">
        <div class="chat-frame">
          <div class="chat-header">
            <div class="chat-header-icon">👥</div>
            <div class="chat-header-body">
              <span class="chat-header-name">Parcel Noti</span>
              <span class="chat-header-status">{{ telegramWarning || `${telegramMessages.length} ข้อความ` }}</span>
            </div>
          </div>
          <div class="chat-messages" ref="chatMessagesArea">
            <div v-if="telegramChatLoading && telegramMessages.length === 0" class="chat-empty-state">
              กำลังโหลดข้อความ...
            </div>
            <div v-else-if="telegramMessages.length === 0" class="chat-empty-state">
              <p>📭 ยังไม่มีข้อความ</p>
              <small>ลองส่งข้อความทดสอบ หรือรอสักครู่</small>
            </div>
            <template v-else>
              <div
                v-for="msg in telegramMessages"
                :key="msg.id"
                class="chat-bubble-wrap"
                :class="isOutgoingMessage(msg) ? 'outgoing' : 'incoming'"
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
            />
            <button @click="sendChatMessage" :disabled="chatSending || !chatInput.trim()">
              {{ chatSending ? '⏳' : '➤' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Volume ─── -->
    <div class="settings-group">
      <div class="settings-group-label">ระดับเสียงพูด</div>
      <div class="settings-list">
        <div class="volume-row">
          <span class="vol-icon">{{ volume === 0 ? '🔇' : volume < 30 ? '🔈' : volume < 70 ? '🔉' : '🔊' }}</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5" 
            :value="volume" 
            @input="updateVolume"
            class="apple-slider"
          />
          <span class="vol-value">{{ volume }}%</span>
        </div>
      </div>
    </div>

    <!-- ─── Wi-Fi ─── -->
    <div class="settings-group">
      <div class="settings-group-label">Wi-Fi</div>
      <div class="settings-list">
        <div class="settings-row">
          <div class="row-icon blue"><span>📶</span></div>
          <div class="row-body">
            <span class="row-title">เครือข่ายปัจจุบัน</span>
          </div>
          <span class="row-detail">{{ currentNetworkStatus }}</span>
        </div>
        <div v-if="networkState.wifiConnected && networkState.lanConnected" class="settings-row">
          <div class="row-icon teal"><span>🔗</span></div>
          <div class="row-body">
            <span class="row-title">สถานะ</span>
          </div>
          <span class="row-detail">เชื่อมทั้ง LAN และ Wi‑Fi</span>
        </div>
      </div>

      <!-- Networks found -->
      <div class="settings-group-label" style="margin-top:24px">
        เครือข่ายที่พบ
        <span v-if="scanning" class="scan-spinner-sm"></span>
      </div>
      <div class="settings-list">
        <div v-if="scanning && wifiNetworks.length === 0" class="settings-row-empty">
          <span class="scan-spinner-md"></span>
          กำลังค้นหาเครือข่าย Wi-Fi...
        </div>
        <template v-if="wifiNetworks.length > 0">
          <div
            v-for="network in wifiNetworks"
            :key="network.bssid || network.ssid"
            class="settings-row clickable"
            :class="{ 'row-connected': network.inUse }"
            @click="onNetworkClick(network)"
          >
            <div class="wifi-signal" :title="`สัญญาณ: ${network.signal}%`">
              <div class="signal-bar" :class="{ active: network.signal >= 10 }"></div>
              <div class="signal-bar" :class="{ active: network.signal >= 30 }"></div>
              <div class="signal-bar" :class="{ active: network.signal >= 55 }"></div>
              <div class="signal-bar" :class="{ active: network.signal >= 80 }"></div>
            </div>
            <div class="row-body">
              <span class="row-title">{{ network.ssid }}</span>
              <span class="row-sub">{{ network.security !== 'Open' ? '🔒' : '🔓' }} {{ network.security }} · {{ network.signal }}%</span>
            </div>
            <span class="row-detail">
              <span v-if="network.inUse" class="detail-on">✓</span>
              <span v-else class="detail-chevron">›</span>
            </span>
          </div>
        </template>
        <div v-else-if="scanAttempted && wifiNetworks.length === 0" class="settings-row-empty">
          ไม่พบเครือข่าย Wi-Fi
        </div>
      </div>

      <!-- Connect Dialog -->
      <div v-if="connectDialog.show" class="overlay" @click.self="closeConnectDialog">
        <div class="apple-dialog">
          <div class="apple-dialog-head">
            <h3>เชื่อมต่อ "{{ connectDialog.ssid }}"</h3>
            <button class="dialog-x" @click="closeConnectDialog">✕</button>
          </div>
          <div class="apple-dialog-content">
            <div class="dialog-meta">
              <span>🔒 {{ connectDialog.security }}</span>
              <span>📶 สัญญาณ {{ connectDialog.signal }}%</span>
            </div>
            <div v-if="connectDialog.security !== 'Open'" class="dialog-field">
              <label>รหัสผ่าน Wi-Fi</label>
              <div class="pw-input-wrap">
                <input
                  ref="connectPasswordInput"
                  v-model="connectDialog.password"
                  :type="connectDialog.showPassword ? 'text' : 'password'"
                  placeholder="ใส่รหัสผ่าน..."
                  @keyup.enter="connectToNetwork"
                  :disabled="connectDialog.connecting"
                />
                <button class="pw-toggle" @click="connectDialog.showPassword = !connectDialog.showPassword">
                  {{ connectDialog.showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
          </div>
          <div class="apple-dialog-actions">
            <button class="dlg-btn secondary" @click="closeConnectDialog" :disabled="connectDialog.connecting">ยกเลิก</button>
            <button
              class="dlg-btn primary"
              @click="connectToNetwork"
              :disabled="connectDialog.connecting || (connectDialog.security !== 'Open' && !connectDialog.password.trim())"
            >
              {{ connectDialog.connecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Manual Wi-Fi -->
      <button class="settings-text-btn" @click="showManualWifi = !showManualWifi">
        {{ showManualWifi ? '▲ ซ่อนฟอร์มกรอกเอง' : '▼ กรอก SSID เอง (เครือข่ายที่ซ่อน)' }}
      </button>
      <div v-if="showManualWifi" class="settings-list" style="margin-top:8px">
        <div class="settings-input-row">
          <input v-model="wifiSsid" type="text" placeholder="ชื่อ Wi-Fi (SSID)" :disabled="loading" />
        </div>
        <div class="settings-input-row">
          <input v-model="wifiPassword" type="password" placeholder="รหัสผ่าน Wi-Fi" :disabled="loading" />
        </div>
        <div class="settings-actions-row">
          <button
            @click="applyWifiConfig"
            class="action-btn blue-btn"
            :disabled="loading || !wifiSsid.trim() || !wifiPassword.trim() || !wsConnected || !serviceStatus.isRunning"
          >
            💾 บันทึก Wi-Fi
          </button>
        </div>
      </div>
      <p class="settings-footnote" v-if="!wsConnected || !serviceStatus.isRunning">
        ต้องอยู่ในสถานะ "ทำงานอยู่" และ "WS: เชื่อมต่อ" ก่อนจึงจะเปลี่ยน Wi-Fi ได้
      </p>
      <div class="settings-list" style="margin-top:12px" v-if="networkState.wifiConnected && networkState.lanConnected">
        <div class="settings-row">
          <div class="row-body">
            <span class="row-title">เลือกเส้นทางใช้งาน</span>
          </div>
          <select class="row-select" v-model="preferredTarget" :disabled="isSwitchingNetwork || !wsConnected || !serviceStatus.isRunning" @change="switchPreferredNetwork">
            <option value="wifi">Wi‑Fi ({{ networkState.wifiName || 'wlan0' }})</option>
            <option value="lan">LAN ({{ networkState.lanName || 'eth0' }})</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ─── Credentials ─── -->
    <div class="settings-group">
      <div class="settings-group-label">Google Cloud Credential</div>
      <div class="settings-list" v-if="credentialInfo">
        <div class="settings-row">
          <div class="row-icon blue"><span>📧</span></div>
          <div class="row-body">
            <span class="row-title">Service Account</span>
          </div>
          <span class="row-detail mono">{{ credentialInfo.clientEmail || 'N/A' }}</span>
        </div>
        <div class="settings-row">
          <div class="row-icon indigo"><span>📁</span></div>
          <div class="row-body">
            <span class="row-title">Project</span>
          </div>
          <span class="row-detail mono">{{ credentialInfo.projectId || 'N/A' }}</span>
        </div>
        <div class="settings-row">
          <div class="row-icon yellow"><span>🔑</span></div>
          <div class="row-body">
            <span class="row-title">Key ID</span>
          </div>
          <span class="row-detail mono">{{ credentialInfo.keyId || 'N/A' }}</span>
        </div>
        <div class="settings-row">
          <div class="row-icon gray"><span>📅</span></div>
          <div class="row-body">
            <span class="row-title">แก้ไขล่าสุด</span>
          </div>
          <span class="row-detail">{{ credentialInfo.lastModified ? new Date(credentialInfo.lastModified).toLocaleString('th-TH') : 'N/A' }}</span>
        </div>
        <div class="settings-row">
          <div class="row-icon" :class="credentialInfo.apiValid ? 'green' : credentialInfo.apiValid === false ? 'red' : 'gray'">
            <span>{{ credentialInfo.apiValid ? '✓' : credentialInfo.apiValid === false ? '✕' : '…' }}</span>
          </div>
          <div class="row-body">
            <span class="row-title">สถานะ API</span>
          </div>
          <span class="row-detail" :class="{ 'detail-on': credentialInfo.apiValid, 'detail-off': credentialInfo.apiValid === false }">
            {{ credentialInfo.apiValid === undefined ? 'กำลังตรวจสอบ...' : credentialInfo.apiValid ? 'ใช้งานได้' : 'ใช้งานไม่ได้' }}
          </span>
        </div>
      </div>
      <div v-else class="settings-list">
        <div class="settings-row-empty">กำลังโหลด...</div>
      </div>
      <div v-if="credentialInfo?.apiError || credentialError" class="settings-alert">
        ⚠️ {{ credentialInfo?.apiError || credentialError }}
      </div>

      <!-- Upload -->
      <div class="settings-group-label" style="margin-top:24px">อัปเดต Credential</div>
      <div class="settings-list">
        <div class="settings-help-row">
          <span class="help-label">วิธีสร้าง Service Account / Key</span>
          <span class="help-trigger" tabindex="0" aria-label="วิธีสร้าง Service Account และ JSON Key">?</span>
          <div class="help-popover">
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
          <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener">Google Cloud Console</a>)
        </p>
        <div class="settings-textarea-wrap">
          <textarea
            v-model="credentialJson"
            placeholder='วาง JSON credential ที่นี่... { "type": "service_account", ... }'
            rows="5"
            :disabled="credentialUploading"
          ></textarea>
        </div>
        <div class="settings-actions-row">
          <button
            @click="uploadCredential"
            class="action-btn blue-btn"
            :disabled="credentialUploading || !credentialJson.trim()"
          >
            {{ credentialUploading ? '⏳ กำลังอัปโหลด...' : '⬆️ อัปเดต Credential' }}
          </button>
          <button
            @click="clearInbox"
            class="action-btn danger-btn"
            :disabled="credentialUploading"
          >
            🗑️ ล้างรูปค้าง
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Logs ─── -->
    <div class="settings-group">
      <div class="settings-group-label">OCR Logs (Realtime)</div>
      <div class="log-toolbar">
        <button 
          @click="toggleAutoScroll" 
          class="log-pill"
          :class="{ active: autoScroll }"
        >
          {{ autoScroll ? '📌 Auto Scroll ON' : '📌 Auto Scroll OFF' }}
        </button>
        <button @click="clearLogs" class="log-pill">🗑️ Clear</button>
        <button @click="refreshLogs" class="log-pill" :disabled="loading">🔄 Refresh</button>
      </div>
      <div class="log-terminal" ref="logsContainer">
        <div v-if="!logs.length" class="log-empty">
          <p>ยังไม่มี log สำหรับแสดง</p>
          <small>กดปุ่ม Refresh เพื่อดึง log ล่าสุด</small>
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
            <span class="log-ts">{{ log.time }}</span>
            <span class="log-msg">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── System Spec & Diagram ─── -->
    <div class="settings-group">
      <div class="settings-group-label">เอกสารระบบ</div>
      <div class="settings-list">
        <div class="settings-row clickable" @click="openSpecPdf">
          <div class="row-icon indigo"><span>📄</span></div>
          <div class="row-body">
            <span class="row-title">System Spec & Diagram</span>
            <span class="row-sub">รายละเอียดระบบ, สถาปัตยกรรม, Sequence Diagram (PDF)</span>
          </div>
          <span class="row-detail detail-chevron">›</span>
        </div>
      </div>
    </div>

    <!-- Status Toast -->
    <div v-if="message" class="settings-toast" :class="messageType">
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

// ─── System Spec & Diagram PDF ──────────────────────────────
const openSpecPdf = () => {
  const html = buildSpecHtml();
  const w = window.open('', '_blank');
  if (!w) { showMessage('กรุณาอนุญาต pop-up เพื่อเปิดเอกสาร', 'error'); return; }
  w.document.write(html);
  w.document.close();
};

function buildSpecHtml() {
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>Tenant Management — System Specification</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Helvetica Neue', sans-serif; color: #1d1d1f; font-size: 11pt; line-height: 1.55; padding: 12px 0; }
  .cover { text-align: center; padding: 60px 20px; page-break-after: always; }
  .cover h1 { font-size: 32pt; font-weight: 700; margin-bottom: 8px; }
  .cover .subtitle { font-size: 14pt; color: #6e6e73; }
  .cover .meta { margin-top: 40px; font-size: 11pt; color: #8e8e93; }
  h2 { font-size: 16pt; font-weight: 700; color: #007AFF; margin: 28px 0 12px; border-bottom: 2px solid #007AFF; padding-bottom: 4px; }
  h3 { font-size: 12pt; font-weight: 600; margin: 18px 0 8px; }
  p, li { margin-bottom: 4px; }
  ul, ol { padding-left: 22px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 10pt; }
  th, td { border: 1px solid #d1d1d6; padding: 6px 10px; text-align: left; }
  th { background: #f2f2f7; font-weight: 600; }
  .mono { font-family: 'SF Mono', Menlo, monospace; font-size: 9.5pt; }
  .section { page-break-inside: avoid; }
  .diagram-box { margin: 16px 0; background: #f9f9fb; border-radius: 10px; padding: 16px; page-break-inside: avoid; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 600; }
  .badge-get { background: #d1f2d1; color: #1a7a1a; }
  .badge-post { background: #d6ecff; color: #005eb8; }
  .badge-put { background: #fff3d6; color: #8a6d00; }
  .badge-del { background: #ffd6d6; color: #c41c1c; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: #007AFF; color: #fff; border: none; padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .print-btn:hover { background: #0062CC; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ บันทึกเป็น PDF</button>

<!-- ═══════════ COVER ═══════════ -->
<div class="cover">
  <h1>🏢 Tenant Management System</h1>
  <p class="subtitle">Raspberry Pi OCR Parcel Notification</p>
  <div class="meta">
    <p>เวอร์ชัน 1.0 &nbsp;·&nbsp; ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>สร้างอัตโนมัติจากระบบ Tenant Manager</p>
  </div>
</div>

<!-- ═══════════ 1. OVERVIEW ═══════════ -->
<h2>1. ภาพรวมระบบ (System Overview)</h2>
<div class="section">
<p>ระบบ <strong>Tenant Management</strong> เป็นระบบจัดการพัสดุอัตโนมัติสำหรับหอพัก ประกอบด้วย 4 ส่วนหลัก:</p>
<table>
  <tr><th>ส่วน</th><th>เทคโนโลยี</th><th>หน้าที่</th></tr>
  <tr><td>🖥️ Frontend</td><td>Vue 3 + Vite (Port 36148)</td><td>หน้าเว็บ UI สำหรับจัดการผู้เช่า, พัสดุ, ควบคุม Pi</td></tr>
  <tr><td>⚙️ Backend</td><td>Node.js + Express (Port 36149)</td><td>REST API, WebSocket, เชื่อมต่อ Pi ผ่าน SSH</td></tr>
  <tr><td>🍓 Raspberry Pi</td><td>Python, OCR Service, กล้อง</td><td>ถ่ายภาพพัสดุ, OCR, ส่ง Telegram, Text-to-Speech</td></tr>
  <tr><td>🗄️ Database</td><td>MySQL (Port 3306)</td><td>เก็บข้อมูลผู้เช่า, พัสดุ, รายงาน</td></tr>
</table>
</div>

<!-- ═══════════ 2. ARCHITECTURE ═══════════ -->
<h2>2. สถาปัตยกรรมระบบ (System Architecture)</h2>
<div class="diagram-box">
<pre class="mermaid">
graph TB
  subgraph User["👤 ผู้ใช้งาน"]
    Browser["🌐 Web Browser\nhttp://project.3bbddns.com:36148"]
  end

  subgraph Frontend["🖥️ Frontend (Vue 3 + Vite)"]
    VueApp["Vue 3 App\nPiControl.vue\nTenantList.vue\nReports.vue"]
    ApiClient["api.js\nHTTP Client"]
    WSClient["WebSocket Client\nReal-time Updates"]
  end

  subgraph Backend["⚙️ Backend Server (:36149)"]
    Express["Express.js\nREST API"]
    WSServer["WebSocket Server\nwith ws library"]
    SSH2["SSH2 Client\nRemote Command"]
    Cron["node-cron\nScheduled Tasks"]
  end

  subgraph Pi["🍓 Raspberry Pi"]
    OCRService["ocr.service\nSystemd Unit"]
    Camera["📷 Camera\nlibcamera-still"]
    Motion["Motion Daemon\nAuto-detect"]
    TTS["🔊 gTTS + mpv\nText-to-Speech"]
    TeleBot["🤖 Telegram Bot API"]
    VisionAPI["☁️ Google Cloud Vision\nOCR Engine"]
  end

  subgraph DB["🗄️ MySQL Database"]
    Tenants[(tenants)]
    Packages[(scanned_packages)]
    Reports[(reports)]
  end

  subgraph Telegram["📱 Telegram Group"]
    TGGroup["Parcel Noti Group\nchat_id: -4824508046"]
  end

  Browser -->|HTTP/WS| VueApp
  VueApp --> ApiClient
  VueApp --> WSClient
  ApiClient -->|fetch REST API| Express
  WSClient -->|WebSocket| WSServer
  Express -->|SQL Query| DB
  Express -->|SSH Command| SSH2
  SSH2 -->|Port 22 via Tailscale| OCRService
  OCRService --> Camera
  OCRService --> Motion
  OCRService --> VisionAPI
  OCRService --> TTS
  OCRService -->|sendMessage API| TeleBot
  TeleBot --> TGGroup
  WSServer -->|broadcast pi-info\nevery 3s| WSClient
  Cron -->|Delete old packages\ndaily 2AM| DB
</pre>
</div>

<!-- ═══════════ 3. TECH STACK ═══════════ -->
<h2>3. Technology Stack</h2>
<div class="section">
<h3>📦 Backend Dependencies</h3>
<table>
  <tr><th>Package</th><th>Version</th><th>หน้าที่</th></tr>
  <tr><td class="mono">express</td><td>^4.18.2</td><td>Web framework สำหรับ REST API</td></tr>
  <tr><td class="mono">mysql2</td><td>^3.3.3</td><td>MySQL driver (promise-based)</td></tr>
  <tr><td class="mono">ssh2</td><td>^1.17.0</td><td>SSH client สำหรับเชื่อมต่อ Raspberry Pi</td></tr>
  <tr><td class="mono">ws</td><td>^8.19.0</td><td>WebSocket server สำหรับ real-time</td></tr>
  <tr><td class="mono">cors</td><td>^2.8.5</td><td>Cross-Origin Resource Sharing</td></tr>
  <tr><td class="mono">node-cron</td><td>^4.2.1</td><td>Scheduled tasks (ลบข้อมูลเก่า)</td></tr>
  <tr><td class="mono">dotenv</td><td>^17.2.3</td><td>อ่าน environment variables</td></tr>
</table>

<h3>📦 Frontend Dependencies</h3>
<table>
  <tr><th>Package</th><th>หน้าที่</th></tr>
  <tr><td class="mono">Vue 3 (Composition API)</td><td>UI Framework</td></tr>
  <tr><td class="mono">Vue Router</td><td>Client-side routing</td></tr>
  <tr><td class="mono">Vite 4.5</td><td>Build tool + Dev server</td></tr>
</table>

<h3>🍓 Raspberry Pi Software</h3>
<table>
  <tr><th>Component</th><th>หน้าที่</th></tr>
  <tr><td class="mono">ocr.service (systemd)</td><td>Main OCR service daemon</td></tr>
  <tr><td class="mono">motion</td><td>Motion detection → trigger camera</td></tr>
  <tr><td class="mono">libcamera-still</td><td>Capture image จากกล้อง</td></tr>
  <tr><td class="mono">Google Cloud Vision API</td><td>OCR engine (Python SDK)</td></tr>
  <tr><td class="mono">gTTS + mpv</td><td>Thai Text-to-Speech</td></tr>
  <tr><td class="mono">Telegram Bot API</td><td>แจ้งเตือนพัสดุเข้ากลุ่ม</td></tr>
  <tr><td class="mono">Tailscale VPN</td><td>เชื่อมต่อ SSH จากทุกที่</td></tr>
  <tr><td class="mono">nmcli (NetworkManager)</td><td>จัดการ Wi-Fi</td></tr>
</table>
</div>

<!-- ═══════════ 4. DATABASE ═══════════ -->
<h2>4. Database Schema</h2>
<div class="section">
<div class="diagram-box">
<pre class="mermaid">
erDiagram
    tenants {
        INT id PK
        VARCHAR name
        VARCHAR address
        VARCHAR room
        VARCHAR phone
        VARCHAR tag
        TIMESTAMP created_at
    }
    scanned_packages {
        INT id PK
        VARCHAR recipient_name
        VARCHAR address
        VARCHAR phone
        VARCHAR image_path
        TEXT raw_text
        INT tenant_id FK
        TIMESTAMP scanned_at
        TIMESTAMP created_at
    }
    reports {
        INT id PK
        VARCHAR type
        DATE date
        TEXT description
        TIMESTAMP created_at
    }
    tenants ||--o{ scanned_packages : "matched to"
</pre>
</div>
</div>

<!-- ═══════════ 5. API ENDPOINTS ═══════════ -->
<h2>5. API Endpoints ทั้งหมด</h2>
<div class="section">
<h3>👥 Tenants (ผู้เช่า)</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/tenants</td><td>แสดงผู้เช่าทั้งหมด</td></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/tenants/:id</td><td>ดูผู้เช่ารายเดียว</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/tenants</td><td>เพิ่มผู้เช่า (name, address, room, phone, tag)</td></tr>
  <tr><td><span class="badge badge-put">PUT</span></td><td class="mono">/api/tenants/:id</td><td>แก้ไขผู้เช่า</td></tr>
  <tr><td><span class="badge badge-del">DEL</span></td><td class="mono">/api/tenants/:id</td><td>ลบผู้เช่า</td></tr>
</table>

<h3>📦 Scanned Packages (พัสดุ)</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/scanned-packages</td><td>แสดงพัสดุทั้งหมด (JOIN tenants)</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/scanned-packages</td><td>เพิ่มพัสดุแบบ manual</td></tr>
  <tr><td><span class="badge badge-put">PUT</span></td><td class="mono">/api/scanned-packages/:id/match/:tenantId</td><td>จับคู่พัสดุกับผู้เช่า</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/ocr-package</td><td>รับข้อมูล OCR จาก Pi (auto)</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/ocr/match-tenant</td><td>จับคู่ OCR text กับผู้เช่า</td></tr>
</table>

<h3>🍓 Pi Control (SSH)</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/status</td><td>สถานะ ocr.service</td></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/info</td><td>ข้อมูลระบบ (uptime, CPU, memory)</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/control</td><td>start / stop / restart service</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/reboot</td><td>รีบูท Raspberry Pi</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/speak</td><td>Text-to-Speech (gTTS)</td></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/volume</td><td>ระดับเสียงปัจจุบัน</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/volume</td><td>ปรับเสียง (amixer + pactl)</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/ssh</td><td>Execute SSH command (admin)</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/inbox/clear</td><td>ล้างรูปค้างจาก motion inbox</td></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/logs</td><td>OCR Logs</td></tr>
  <tr><td><span class="badge badge-del">DEL</span></td><td class="mono">/api/pi/logs</td><td>ล้าง Logs</td></tr>
</table>

<h3>📶 Wi-Fi Management</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/wifi</td><td>สถานะ Wi-Fi / LAN</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/wifi</td><td>เชื่อมต่อ Wi-Fi ใหม่</td></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/wifi/scan</td><td>สแกน Wi-Fi รอบข้าง</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/network/prefer</td><td>สลับ Wi-Fi / LAN</td></tr>
</table>

<h3>📨 Telegram Chat</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/telegram/messages</td><td>ดึงข้อความจากกลุ่ม (cached 3s)</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/telegram/send</td><td>ส่งข้อความไปกลุ่ม</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/telegram/test</td><td>ส่งข้อความทดสอบ</td></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/telegram/file/:fileId</td><td>Proxy ดาวน์โหลดไฟล์ Telegram</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/capture-telegram</td><td>ถ่ายรูป → OCR → ส่ง Telegram</td></tr>
</table>

<h3>🔑 GCP Credential</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/pi/credential</td><td>ตรวจสอบ GCP key + ทดสอบ Vision API</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/pi/credential</td><td>อัปโหลด credential JSON ใหม่</td></tr>
</table>

<h3>📊 Reports</h3>
<table>
  <tr><th>Method</th><th>Endpoint</th><th>คำอธิบาย</th></tr>
  <tr><td><span class="badge badge-get">GET</span></td><td class="mono">/api/reports</td><td>แสดงรายงานทั้งหมด</td></tr>
  <tr><td><span class="badge badge-post">POST</span></td><td class="mono">/api/reports</td><td>สร้างรายงาน</td></tr>
  <tr><td><span class="badge badge-del">DEL</span></td><td class="mono">/api/reports/:id</td><td>ลบรายงาน</td></tr>
</table>
</div>

<!-- ═══════════ 6. SEQUENCE: OCR AUTO ═══════════ -->
<h2>6. Sequence Diagram: OCR อัตโนมัติ (Motion → Notify)</h2>
<div class="diagram-box">
<pre class="mermaid">
sequenceDiagram
    participant M as 📷 Motion Sensor
    participant Pi as 🍓 Raspberry Pi
    participant GV as ☁️ Google Vision
    participant BE as ⚙️ Backend :36149
    participant DB as 🗄️ MySQL
    participant WS as 🔌 WebSocket
    participant FE as 🖥️ Frontend
    participant TG as 📱 Telegram

    M->>Pi: ตรวจพบการเคลื่อนไหว
    Pi->>Pi: libcamera-still ถ่ายภาพ
    Pi->>GV: ส่งรูปไป OCR (Vision API)
    GV-->>Pi: ข้อความที่อ่านได้ (rawText)
    Pi->>Pi: แยก ชื่อ, ที่อยู่, เบอร์โทร
    Pi->>BE: POST /api/ocr-package\n{recipientName, address, rawText, imageBase64}
    BE->>BE: บันทึกรูปไป /uploads/
    BE->>DB: SELECT tenants WHERE name LIKE '%...%'
    DB-->>BE: ผู้เช่าที่ตรงกัน (หรือ null)
    BE->>DB: INSERT INTO scanned_packages
    BE->>WS: broadcast('new_package', {...})
    WS-->>FE: real-time แสดงพัสดุใหม่
    Pi->>TG: sendMessage (แจ้งเตือนพัสดุ)
    TG-->>TG: แสดงในกลุ่ม Parcel Noti
</pre>
</div>

<!-- ═══════════ 7. SEQUENCE: MANUAL CAPTURE ═══════════ -->
<h2>7. Sequence Diagram: ถ่ายรูป Manual (Web → Pi → Telegram)</h2>
<div class="diagram-box">
<pre class="mermaid">
sequenceDiagram
    participant U as 👤 ผู้ใช้
    participant FE as 🖥️ Frontend
    participant BE as ⚙️ Backend
    participant Pi as 🍓 Raspberry Pi
    participant GV as ☁️ Google Vision
    participant TG as 📱 Telegram

    U->>FE: คลิก "📸 ถ่ายแล้วส่ง Telegram"
    FE->>BE: POST /api/pi/capture-telegram
    BE->>Pi: SSH: libcamera-still /tmp/manual_capture.jpg
    Pi->>Pi: ถ่ายภาพสำเร็จ
    BE->>Pi: SSH: python3 ocr_script.py
    Pi->>GV: ส่งรูปไป Google Vision OCR
    GV-->>Pi: ข้อความ OCR
    Pi->>Pi: สร้างข้อความแจ้งเตือน
    BE->>Pi: SSH: curl Telegram sendMessage
    Pi->>TG: ส่งข้อความไปกลุ่ม
    TG-->>TG: แสดงในกลุ่ม
    BE-->>FE: {success: true, ocrText: '...'}
    FE-->>U: แสดง Toast "สำเร็จ"
</pre>
</div>

<!-- ═══════════ 8. SEQUENCE: SPEAK ═══════════ -->
<h2>8. Sequence Diagram: Text-to-Speech</h2>
<div class="diagram-box">
<pre class="mermaid">
sequenceDiagram
    participant U as 👤 ผู้ใช้
    participant FE as 🖥️ Frontend
    participant BE as ⚙️ Backend
    participant Pi as 🍓 Raspberry Pi
    participant SPK as 🔊 ลำโพง

    U->>FE: พิมพ์ข้อความ + คลิก "พูด"
    FE->>BE: POST /api/pi/speak {text}
    BE->>Pi: SSH: python3 -c "gTTS(text).save('/tmp/tts.mp3')"
    Pi->>Pi: gTTS สร้างไฟล์เสียง .mp3
    BE->>Pi: SSH: mpv /tmp/tts.mp3
    Pi->>SPK: เล่นเสียงผ่านลำโพง
    BE-->>FE: {success: true}
    FE-->>U: Toast "ส่งข้อความพูดไปยัง Pi แล้ว"
</pre>
</div>

<!-- ═══════════ 9. SEQUENCE: REALTIME ═══════════ -->
<h2>9. Sequence Diagram: Real-time System Monitoring</h2>
<div class="diagram-box">
<pre class="mermaid">
sequenceDiagram
    participant FE as 🖥️ Frontend
    participant WS as 🔌 WebSocket
    participant BE as ⚙️ Backend
    participant Pi as 🍓 Raspberry Pi

    FE->>WS: เชื่อมต่อ WebSocket
    WS-->>FE: connected

    loop ทุก 3 วินาที
        BE->>Pi: SSH: uptime + temp + free + systemctl
        Pi-->>BE: {uptime, cpuTemp, memory, isRunning}
        BE->>WS: broadcast('pi-info', data)
        WS-->>FE: อัปเดต UI ทันที
    end

    Note over FE: หน้าเว็บแสดงสถานะ realtime\nไม่ต้อง refresh

    FE->>WS: ตัดการเชื่อมต่อ
    Note over FE: auto-reconnect ใน 3 วินาที
</pre>
</div>

<!-- ═══════════ 10. SEQUENCE: WIFI ═══════════ -->
<h2>10. Sequence Diagram: เปลี่ยน Wi-Fi</h2>
<div class="diagram-box">
<pre class="mermaid">
sequenceDiagram
    participant U as 👤 ผู้ใช้
    participant FE as 🖥️ Frontend
    participant BE as ⚙️ Backend
    participant Pi as 🍓 Raspberry Pi

    FE->>BE: GET /api/pi/wifi/scan
    BE->>Pi: SSH: nmcli device wifi list
    Pi-->>BE: รายชื่อเครือข่าย []
    BE-->>FE: แสดงรายการ Wi-Fi
    U->>FE: คลิกเลือกเครือข่าย + ใส่รหัสผ่าน
    FE->>BE: POST /api/pi/wifi {ssid, password}
    BE->>Pi: SSH: nmcli device wifi connect ...
    Pi->>Pi: เชื่อมต่อเครือข่ายใหม่
    Pi-->>BE: สำเร็จ
    BE-->>FE: {success, ssid}
    FE-->>U: Alert "เชื่อม Wi-Fi สำเร็จ"
</pre>
</div>

<!-- ═══════════ 11. SEQUENCE: TELEGRAM CHAT ═══════════ -->
<h2>11. Sequence Diagram: Telegram Chat Preview</h2>
<div class="diagram-box">
<pre class="mermaid">
sequenceDiagram
    participant FE as 🖥️ Frontend
    participant BE as ⚙️ Backend
    participant Pi as 🍓 Raspberry Pi
    participant TG as 📱 Telegram API

    loop ทุก 5 วินาที (Polling)
        FE->>BE: GET /api/pi/telegram/messages
        alt Cache ยังใหม่ (< 3s)
            BE-->>FE: ส่งจาก cache
        else Cache หมดอายุ
            BE->>Pi: SSH: curl getUpdates
            Pi->>TG: Telegram Bot API getUpdates
            TG-->>Pi: messages[]
            Pi-->>BE: JSON messages
            BE->>BE: mapTelegramMessage() + dedup
            BE->>BE: บันทึกลง cache (max 100)
            BE-->>FE: {messages, success}
        end
    end

    FE->>FE: แสดง chat bubbles (iMessage style)

    Note over FE,BE: รูปภาพ/ไฟล์ ดึงผ่าน proxy\nGET /api/pi/telegram/file/:fileId
</pre>
</div>

<!-- ═══════════ 12. CACHING ═══════════ -->
<h2>12. ระบบ Cache</h2>
<div class="section">
<table>
  <tr><th>Cache</th><th>TTL</th><th>ขนาดสูงสุด</th><th>หน้าที่</th></tr>
  <tr><td class="mono">telegramMsgCache</td><td>3 วินาที</td><td>100 ข้อความ</td><td>ป้องกันเรียก getUpdates ถี่เกินไป</td></tr>
  <tr><td class="mono">telegramFilePathCache</td><td>5 นาที</td><td>ไม่จำกัด</td><td>Cache Telegram file path resolution</td></tr>
  <tr><td class="mono">systemLogCache</td><td>8 วินาที</td><td>-</td><td>Cache journalctl error logs</td></tr>
  <tr><td class="mono">ocrLogs</td><td>ไม่หมดอายุ</td><td>500 entries</td><td>In-memory OCR activity log</td></tr>
</table>
</div>

<!-- ═══════════ 13. NETWORK ═══════════ -->
<h2>13. Network & Ports</h2>
<div class="section">
<table>
  <tr><th>Port</th><th>Service</th><th>หน้าที่</th></tr>
  <tr><td>36148</td><td>Frontend (Vite)</td><td>Web UI</td></tr>
  <tr><td>36149</td><td>Backend (Express + WS)</td><td>REST API + WebSocket</td></tr>
  <tr><td>3306</td><td>MySQL</td><td>Database</td></tr>
  <tr><td>22</td><td>SSH (via Tailscale VPN)</td><td>เชื่อมต่อ Raspberry Pi</td></tr>
</table>
<p style="margin-top:10px"><strong>การเชื่อมต่อ Pi:</strong> ใช้ Tailscale VPN (MagicDNS: <code class="mono">pipi4.tail72aff6.ts.net</code>) ทำให้เข้าถึง Pi ได้จากทุกที่โดยไม่ต้อง port forwarding</p>
</div>

<!-- ═══════════ 14. CRON ═══════════ -->
<h2>14. Scheduled Tasks</h2>
<div class="section">
<table>
  <tr><th>เวลา</th><th>Task</th><th>คำอธิบาย</th></tr>
  <tr><td class="mono">0 2 * * *</td><td>Auto-delete old packages</td><td>ลบพัสดุที่เก่ากว่า 30 วัน (รวมรูปภาพ) ทุกวันตี 2</td></tr>
  <tr><td class="mono">setInterval 3s</td><td>Pi Info Broadcast</td><td>SSH ไปดึง system info แล้ว broadcast ผ่าน WebSocket</td></tr>
  <tr><td class="mono">setInterval 5s</td><td>Wi-Fi Scan</td><td>สแกน Wi-Fi อัตโนมัติ (เฉพาะหน้า /pi)</td></tr>
  <tr><td class="mono">setInterval 5s</td><td>Telegram Polling</td><td>ดึงข้อความ Telegram ใหม่ (frontend)</td></tr>
</table>
</div>

<div style="margin-top:40px;text-align:center;color:#8e8e93;font-size:10pt;">
  <p>— End of Document —</p>
  <p>Auto-generated by Tenant Management System · ${new Date().toLocaleString('th-TH')}</p>
</div>

<script>mermaid.initialize({startOnLoad:true,theme:'default',securityLevel:'loose',flowchart:{useMaxWidth:true},sequence:{useMaxWidth:true,showSequenceNumbers:false}});<\/script>
</body>
</html>`;
}

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
/* ================================================================
   Apple iOS Settings Design System
   ================================================================ */

/* Page */
.settings-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 16px 40px;
  min-height: 100vh;
}

/* Nav / Large Title */
.settings-nav {
  padding: 12px 0 8px;
  margin-bottom: 6px;
}

.settings-large-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #000;
  margin: 0;
  line-height: 1.18;
}

.settings-subtitle {
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--apple-gray-1, #8E8E93);
  font-weight: 400;
}

/* ─── Group ─── */
.settings-group {
  margin-bottom: 28px;
}

.settings-group-label {
  font-size: 13px;
  font-weight: 400;
  color: #6e6e73;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  padding: 0 16px 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ─── List (white card) ─── */
.settings-list {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.settings-list.no-padding {
  padding: 0;
}

/* ─── Row ─── */
.settings-row {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 16px;
  gap: 12px;
  position: relative;
}

.settings-row + .settings-row {
  border-top: 0.5px solid rgba(60, 60, 67, 0.12);
  margin-left: 0;
}

/* inset separator (starts after icon) */
.settings-row + .settings-row::before {
  content: none;
}

.settings-row.clickable {
  cursor: pointer;
  transition: background 0.15s;
}

.settings-row.clickable:active {
  background: rgba(0, 0, 0, 0.04);
}

.settings-row.row-connected {
  background: rgba(52, 199, 89, 0.06);
}

/* ─── Row Icon ─── */
.row-icon {
  width: 29px;
  height: 29px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  color: #fff;
}

.row-icon.orange  { background: #FF9500; }
.row-icon.red     { background: #FF3B30; }
.row-icon.green   { background: #34C759; }
.row-icon.blue    { background: #007AFF; }
.row-icon.purple  { background: #AF52DE; }
.row-icon.indigo  { background: #5856D6; }
.row-icon.teal    { background: #5AC8FA; }
.row-icon.yellow  { background: #FFCC00; }
.row-icon.gray    { background: #8E8E93; }
.row-icon.pink    { background: #FF2D55; }

/* ─── Row Body (label area) ─── */
.row-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-title {
  font-size: 17px;
  color: #000;
  line-height: 1.29;
}

.row-sub {
  font-size: 12px;
  color: #8E8E93;
  line-height: 1.35;
  margin-top: 1px;
}

/* ─── Row Detail (right side) ─── */
.row-detail {
  font-size: 17px;
  color: #8E8E93;
  flex-shrink: 0;
  text-align: right;
  max-width: 55%;
  word-break: break-all;
}

.row-detail.mono {
  font-family: 'SF Mono', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
}

.row-detail.detail-on,
.detail-on {
  color: #34C759;
  font-weight: 600;
}

.row-detail.detail-off,
.detail-off {
  color: #FF3B30;
  font-weight: 600;
}

.detail-chevron {
  color: #C7C7CC;
  font-size: 20px;
  font-weight: 300;
}

/* ─── Row placeholder / empty ─── */
.settings-row-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  color: #8E8E93;
  font-size: 15px;
}

/* ─── Input Row ─── */
.settings-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}

.settings-input-row + .settings-input-row,
.settings-input-row + .settings-chips-row,
.settings-chips-row + .settings-actions-row,
.settings-input-row + .settings-actions-row {
  border-top: 0.5px solid rgba(60, 60, 67, 0.12);
}

.settings-input-row input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #D1D1D6;
  border-radius: 10px;
  font-size: 17px;
  outline: none;
  background: #F2F2F7;
  color: #000;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.settings-input-row input:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 3.5px rgba(0, 122, 255, 0.15);
  background: #fff;
}

.input-btn-primary {
  padding: 10px 22px;
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.input-btn-primary:hover:not(:disabled) {
  background: #0062CC;
}

.input-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── Chips Row ─── */
.settings-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  align-items: center;
}

.chips-label {
  font-size: 13px;
  color: #8E8E93;
  margin-right: 4px;
}

.chip {
  background: #F2F2F7;
  border: none;
  padding: 7px 16px;
  border-radius: 100px;
  font-size: 15px;
  color: #007AFF;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.chip:hover {
  background: #E5E5EA;
}

.chip:active {
  background: #D1D1D6;
  transform: scale(0.97);
}

/* ─── Actions Row ─── */
.settings-actions-row {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 140px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.green-btn {
  background: #34C759;
  color: #fff;
}

.green-btn:hover:not(:disabled) {
  background: #2EA94F;
}

.blue-btn {
  background: #007AFF;
  color: #fff;
}

.blue-btn:hover:not(:disabled) {
  background: #0062CC;
}

.danger-btn {
  background: #F2F2F7;
  color: #FF3B30;
  border: 1px solid #E5E5EA;
}

.danger-btn:hover:not(:disabled) {
  background: #FFF0F0;
}

/* ─── Select ─── */
.row-select {
  padding: 8px 12px;
  border: 1px solid #D1D1D6;
  border-radius: 8px;
  background: #F2F2F7;
  color: #000;
  font-size: 15px;
  outline: none;
  font-family: inherit;
}

.row-select:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── Text Button ─── */
.settings-text-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 15px;
  cursor: pointer;
  padding: 8px 16px;
  margin-top: 8px;
  font-family: inherit;
}

.settings-text-btn:hover {
  text-decoration: underline;
}

/* ─── Footnote ─── */
.settings-footnote {
  font-size: 13px;
  color: #8E8E93;
  padding: 6px 16px 0;
  line-height: 1.4;
}

/* ─── Alert ─── */
.settings-alert {
  margin-top: 8px;
  padding: 10px 16px;
  background: #FFF3F3;
  border: 1px solid #FFCCCB;
  border-radius: 10px;
  color: #D32F2F;
  font-size: 14px;
  font-weight: 500;
}

/* ─── Wi-Fi Signal Bars ─── */
.wifi-signal {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 18px;
  width: 20px;
  flex-shrink: 0;
}

.wifi-signal .signal-bar {
  width: 3.5px;
  border-radius: 1px;
  background: #D1D1D6;
  transition: background 0.2s;
}

.wifi-signal .signal-bar:nth-child(1) { height: 4px; }
.wifi-signal .signal-bar:nth-child(2) { height: 8px; }
.wifi-signal .signal-bar:nth-child(3) { height: 12px; }
.wifi-signal .signal-bar:nth-child(4) { height: 18px; }

.wifi-signal .signal-bar.active { background: #007AFF; }
.row-connected .wifi-signal .signal-bar.active { background: #34C759; }

/* ─── Spin ─── */
.scan-spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #D1D1D6;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.scan-spinner-md {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2.5px solid #E5E5EA;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Overlay / Dialog ─── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.apple-dialog {
  background: #fff;
  border-radius: 14px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.apple-dialog-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 12px;
}

.apple-dialog-head h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.dialog-x {
  background: #F2F2F7;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8E8E93;
  transition: background 0.15s;
}

.dialog-x:hover {
  background: #E5E5EA;
}

.apple-dialog-content {
  padding: 0 20px 16px;
}

.dialog-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6e6e73;
  margin-bottom: 16px;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-field label {
  font-size: 14px;
  color: #6e6e73;
  font-weight: 500;
}

.pw-input-wrap {
  display: flex;
  border: 1px solid #D1D1D6;
  border-radius: 10px;
  overflow: hidden;
  background: #F2F2F7;
}

.pw-input-wrap input {
  flex: 1;
  border: none;
  padding: 12px 14px;
  font-size: 17px;
  outline: none;
  background: transparent;
  font-family: inherit;
}

.pw-toggle {
  background: transparent;
  border: none;
  padding: 0 14px;
  cursor: pointer;
  font-size: 17px;
}

.apple-dialog-actions {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
  justify-content: flex-end;
}

.dlg-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.dlg-btn.primary {
  background: #007AFF;
  color: #fff;
}

.dlg-btn.primary:hover:not(:disabled) {
  background: #0062CC;
}

.dlg-btn.secondary {
  background: #F2F2F7;
  color: #000;
}

.dlg-btn.secondary:hover:not(:disabled) {
  background: #E5E5EA;
}

.dlg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── Volume ─── */
.volume-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.vol-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.vol-value {
  font-size: 15px;
  font-weight: 600;
  color: #000;
  min-width: 44px;
  text-align: right;
  flex-shrink: 0;
}

.apple-slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #D1D1D6;
  outline: none;
}

.apple-slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
}

.apple-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  margin-top: -12px;
  transition: transform 0.15s;
}

.apple-slider::-webkit-slider-thumb:hover {
  transform: scale(1.08);
}

.apple-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  border: 0.5px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16);
  cursor: pointer;
}

/* ─── Telegram Chat ─── */
.chat-frame {
  display: flex;
  flex-direction: column;
  max-height: 520px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #F9F9F9;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
}

.chat-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
}

.chat-header-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header-name {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.chat-header-status {
  font-size: 12px;
  color: #8E8E93;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 200px;
  max-height: 380px;
  background: #F2F2F7;
}

.chat-empty-state {
  text-align: center;
  padding: 40px 16px;
  color: #8E8E93;
  font-size: 15px;
}

.chat-empty-state small {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: #AEAEB2;
}

.chat-bubble-wrap {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.chat-bubble-wrap.incoming {
  justify-content: flex-start;
}

.chat-bubble-wrap.outgoing {
  justify-content: flex-end;
}

.chat-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #007AFF;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-bubble {
  max-width: 78%;
  padding: 8px 12px;
  border-radius: 18px;
  position: relative;
  word-break: break-word;
}

.incoming .chat-bubble {
  background: #fff;
  color: #000;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
}

.outgoing .chat-bubble {
  background: #007AFF;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-sender {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #007AFF;
  margin-bottom: 2px;
}

.outgoing .chat-sender {
  color: rgba(255, 255, 255, 0.8);
}

.chat-attachment {
  display: inline-block;
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 2px;
}

.outgoing .chat-attachment {
  color: rgba(255, 255, 255, 0.75);
}

.chat-media-image,
.chat-media-video {
  width: 100%;
  max-width: 240px;
  border-radius: 12px;
  margin: 4px 0;
  display: block;
}

.chat-media-audio {
  width: 100%;
  max-width: 240px;
  margin: 4px 0;
}

.chat-file-link {
  display: inline-block;
  margin: 4px 0;
  padding: 6px 12px;
  border-radius: 10px;
  background: #F2F2F7;
  color: #007AFF;
  text-decoration: none;
  font-size: 14px;
}

.chat-file-link:hover {
  text-decoration: underline;
}

.chat-meta-box {
  margin: 4px 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 13px;
  line-height: 1.4;
}

.outgoing .chat-meta-box {
  background: rgba(255, 255, 255, 0.15);
}

.chat-text {
  margin: 0;
  font-size: 17px;
  line-height: 1.35;
  white-space: pre-wrap;
}

.chat-time {
  display: block;
  text-align: right;
  font-size: 11px;
  margin-top: 2px;
}

.incoming .chat-time {
  color: #8E8E93;
}

.outgoing .chat-time {
  color: rgba(255, 255, 255, 0.6);
}

.chat-input-bar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: #F9F9F9;
  border-top: 0.5px solid rgba(60, 60, 67, 0.12);
}

.chat-input-bar input {
  flex: 1;
  border: 1px solid #D1D1D6;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 17px;
  outline: none;
  background: #fff;
  font-family: inherit;
  transition: border-color 0.2s;
}

.chat-input-bar input:focus {
  border-color: #007AFF;
}

.chat-input-bar button {
  background: #007AFF;
  color: #fff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.chat-input-bar button:hover:not(:disabled) {
  background: #0062CC;
}

.chat-input-bar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── Help Row ─── */
.settings-help-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.help-label {
  font-size: 14px;
  color: #6e6e73;
  font-weight: 500;
}

.help-trigger {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #007AFF;
  cursor: help;
  user-select: none;
}

.help-popover {
  position: absolute;
  left: 16px;
  top: calc(100% + 4px);
  width: min(400px, 85vw);
  background: #1D1D1F;
  color: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: all 0.18s ease;
  z-index: 30;
}

.help-popover p {
  margin: 0 0 8px;
  font-size: 14px;
}

.help-popover ol {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.5;
}

.settings-help-row:hover .help-popover,
.settings-help-row:focus-within .help-popover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.credential-hint {
  font-size: 13px;
  color: #8E8E93;
  padding: 4px 16px 8px;
  line-height: 1.5;
  margin: 0;
}

.credential-hint a {
  color: #007AFF;
  text-decoration: none;
}

.credential-hint a:hover {
  text-decoration: underline;
}

/* ─── Textarea ─── */
.settings-textarea-wrap {
  padding: 0 12px 4px;
}

.settings-textarea-wrap textarea {
  width: 100%;
  border: 1px solid #D1D1D6;
  border-radius: 10px;
  padding: 12px 14px;
  font-family: 'SF Mono', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  resize: vertical;
  background: #F2F2F7;
  color: #000;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.settings-textarea-wrap textarea:focus {
  border-color: #007AFF;
  box-shadow: 0 0 0 3.5px rgba(0, 122, 255, 0.12);
  background: #fff;
}

.settings-textarea-wrap textarea:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ─── Log Section ─── */
.log-toolbar {
  display: flex;
  gap: 8px;
  padding: 0 0 10px;
  flex-wrap: wrap;
}

.log-pill {
  padding: 6px 14px;
  background: #fff;
  color: #007AFF;
  border: 1px solid #D1D1D6;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.log-pill:hover:not(:disabled) {
  background: #F2F2F7;
}

.log-pill:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.log-pill.active {
  background: #34C759;
  color: #fff;
  border-color: #34C759;
}

.log-terminal {
  height: 360px;
  background: #1C1C1E;
  border-radius: 10px;
  padding: 14px;
  overflow-y: auto;
  font-family: 'SF Mono', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  color: #E5E5EA;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #636366;
}

.log-empty p {
  margin: 4px 0;
}

.log-empty small {
  font-size: 11px;
  color: #48484A;
}

.log-line {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #2C2C2E;
  align-items: flex-start;
}

.log-line:last-child {
  border-bottom: none;
}

.log-ts {
  color: #636366;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 11px;
}

.log-msg {
  color: #E5E5EA;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-scan { color: #64D2FF; }
.log-match { color: #30D158; }
.log-send { color: #FFD60A; }
.log-error { color: #FF453A; }
.log-skip { color: #BF5AF2; }

.log-system-error {
  color: #FF6961;
  border-left: 3px solid #FF3B30;
  padding-left: 8px;
}

/* ─── Toast ─── */
.settings-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 500;
  z-index: 9999;
  max-width: 90%;
  text-align: center;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  animation: toast-in 0.3s ease;
}

.settings-toast.success {
  background: rgba(52, 199, 89, 0.9);
  color: #fff;
}

.settings-toast.error {
  background: rgba(255, 59, 48, 0.9);
  color: #fff;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* ─── Responsive ─── */
@media (max-width: 600px) {
  .settings-page {
    padding: 0 8px 32px;
  }

  .settings-large-title {
    font-size: 28px;
  }

  .settings-input-row {
    flex-direction: column;
  }

  .settings-input-row input {
    font-size: 16px;
  }

  .input-btn-primary {
    width: 100%;
    font-size: 16px;
  }

  .settings-actions-row {
    flex-direction: column;
  }

  .action-btn {
    min-width: 0;
    width: 100%;
  }

  .row-detail {
    font-size: 15px;
  }

  .chat-text {
    font-size: 16px;
  }

  .log-terminal {
    height: 260px;
  }
}
</style>
