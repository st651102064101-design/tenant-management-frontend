<template>
  <section class="apple-section">
    <header class="section-header">
      <div class="header-content">
        <h2>พัสดุที่สแกน</h2>
        <p class="header-subtitle">จัดการและจับคู่พัสดุกับผู้เช่า</p>
      </div>
      <div class="header-stats">
        <div 
          class="stat-pill matched" 
          @click="toggleFilter('matched')"
          :class="{ active: activeFilter === 'matched' }"
          role="button"
          tabindex="0"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="stat-icon">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>{{ matchedCount }} จับคู่แล้ว</span>
        </div>
        <div 
          class="stat-pill unmatched" 
          @click="toggleFilter('unmatched')"
          :class="{ active: activeFilter === 'unmatched' }"
          role="button"
          tabindex="0"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="stat-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{{ unmatchedCount }} รอจับคู่</span>
        </div>
        <div 
          v-if="activeFilter !== null"
          class="stat-pill reset"
          @click="activeFilter = null"
          role="button"
          tabindex="0"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="stat-icon">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
          <span>ล้างตัวกรอง</span>
        </div>
      </div>

      <!-- Notice: packages auto-delete policy -->
      <div class="packages-notice">
        <svg viewBox="0 0 24 24" fill="currentColor" class="notice-icon"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 11h-2V7h2v6zm0 4h-2v-2h2v2z"/></svg>
        <div class="notice-text">ระบบจะลบรายการพัสดุที่เก่ากว่า <strong>1 เดือน</strong> อัตโนมัติตามเวลาที่บันทึกในพัสดุ</div>
      </div>
    </header>

    <div class="table-card">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>กำลังโหลดข้อมูล...</span>
      </div>

      <div v-else-if="!filteredPackages.length" class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        </svg>
        <h3>ไม่มีข้อมูลพัสดุ</h3>
        <p v-if="activeFilter">ไม่มีพัสดุที่ตรงกับตัวกรอง</p>
        <p v-else>ยังไม่มีพัสดุที่สแกนในระบบ</p>
      </div>

      <table v-else :key="activeFilter" id="packagesTable" class="apple-table display">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ภาพ</th>
            <th>รายละเอียด</th>
            <th>ผู้เช่าที่ตรงกัน</th>
            <th>สถานะ</th>
            <th>การกระทำ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pkg, index) in filteredPackages" :key="pkg.id">
            <td class="center" data-label="ลำดับ">{{ index + 1 }}</td>
            <td class="image-cell" data-label="ภาพ">
              <img 
                v-if="pkg.imagePath" 
                :src="getImageUrl(pkg.imagePath)" 
                alt="พัสดุ" 
                class="package-thumbnail"
                @click="openImageModal(pkg)"
              />
              <span v-else class="no-image">-</span>
            </td>
            <td class="details-cell" data-label="รายละเอียด">
              <div class="recipient-info">
                <div class="recipient-avatar">
                  {{ getPackageRecipient(pkg).charAt(0) || '?' }}
                </div>
                <div class="recipient-main">
                  <div class="recipient-name">{{ getPackageRecipient(pkg) }}</div>
                  <div class="recipient-meta">
                    <span v-if="getPackagePhone(pkg)" class="meta-phone">📞 <a :href="'tel:' + getPackagePhoneDigits(pkg)">{{ formatPhone(getPackagePhone(pkg)) }}</a></span>
                    <span class="meta-address" :title="getPackageAddress(pkg)">📍 {{ getPackageAddressShort(pkg) }}</span>
                    <span v-if="getPackageDateTime(pkg)" class="meta-time">🕐 {{ getPackageDateTime(pkg) }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td data-label="ผู้เช่า">
              <div v-if="pkg.tenant" class="tenant-block">
                <span class="tenant-badge matched">{{ pkg.tenant.name }}</span>
                <span v-if="pkg.tenant.tag" class="tag-badge small">{{ pkg.tenant.tag }}</span>
              </div>
              <div v-else class="tenant-badge pending">ยังไม่ได้จับคู่</div>
            </td>
            <td class="center" data-label="สถานะ">
              <span :class="['status-badge', pkg.tenant ? 'success' : 'warning']">
                {{ pkg.tenant ? 'จับคู่แล้ว' : 'รอจับคู่' }}
              </span>
            </td>
            <td class="center" data-label="จัดการ">
              <button 
                class="action-btn match" 
                @click="matchTenant(pkg)" 
                :disabled="!!pkg.tenant"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" v-if="!pkg.tenant">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
                <svg viewBox="0 0 24 24" fill="currentColor" v-else>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                {{ pkg.tenant ? 'จับคู่แล้ว' : 'จับคู่' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Image Modal -->
    <div v-if="selectedImage" class="image-modal-overlay" @click.self="closeImageModal">
      <div class="image-modal">
        <button class="modal-close" @click="closeImageModal">×</button>
        <img 
          v-if="selectedImage.imagePath" 
          :src="getImageUrl(selectedImage.imagePath)" 
          alt="ภาพพัสดุ" 
          class="modal-image"
        />
        <div class="modal-info">
          <h3>{{ selectedImage.recipientName || 'ไม่ระบุชื่อ' }}</h3>
          <p v-if="selectedImage.phone">📞 {{ formatPhone(selectedImage.phone) }}</p>
          <p v-if="selectedImage.address">📍 {{ selectedImage.address }}</p>
          <p v-if="selectedImage.scannedAt">🕐 {{ formatDateTime(selectedImage.scannedAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Tenant Selection Modal -->
    <div v-if="matchingPackage" class="image-modal-overlay" @click.self="cancelMatchTenant">
      <div class="image-modal" style="max-height: 70vh; display: flex; flex-direction: column; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 20px;">เลือกผู้เช่า</h3>
          <button class="modal-close" @click="cancelMatchTenant">×</button>
        </div>
        <div style="flex: 1; overflow-y: auto; padding: 0 4px;">
          <div v-if="tenants.length === 0" class="empty-state" style="padding: 24px; text-align: center;">
            <p>ไม่มีผู้เช่าในระบบ</p>
          </div>
          <div v-else class="tenant-selection-list">
            <button 
              v-for="tenant in tenants" 
              :key="tenant.id"
              class="tenant-selection-item"
              @click="confirmMatchTenant(tenant.id)"
            >
              <div class="tenant-selection-avatar">{{ tenant.name.charAt(0) }}</div>
              <div class="tenant-selection-info">
                <div class="tenant-selection-name">{{ tenant.name }}</div>
                <div class="tenant-selection-meta">
                  <span v-if="tenant.room">🚪 {{ tenant.room }}</span>
                  <span v-if="tenant.phone">📞 {{ formatPhone(tenant.phone) }}</span>
                  <span v-if="tenant.tag">🏷️ {{ tenant.tag }}</span>
                </div>
              </div>
              <svg viewBox="0 0 24 24" fill="currentColor" class="selection-checkmark">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { packageAPI, tenantAPI } from '../api.js';
import { errorMessages, API_BASE_URL, WS_URL } from '../config.js';
import { useDialog } from '../composables/useDialog.js';
import $ from 'jquery';
import DataTable from 'datatables.net-dt';

const { alert: showAlert } = useDialog();

const packages = ref([]);
const tenants = ref([]);
const loading = ref(false);
const selectedImage = ref(null);
const matchingPackage = ref(null);
const activeFilter = ref(null);
let dataTable = null;
let ws = null;

const matchedCount = computed(() => packages.value.filter(p => p.tenant).length);
const unmatchedCount = computed(() => packages.value.filter(p => !p.tenant).length);

const filteredPackages = computed(() => {
  if (activeFilter.value === 'matched') {
    return packages.value.filter(p => p.tenant);
  } else if (activeFilter.value === 'unmatched') {
    return packages.value.filter(p => !p.tenant);
  }
  return packages.value;
});

// Watch for filter changes and reinit DataTable
watch(activeFilter, () => {
  if (dataTable) {
    dataTable.destroy();
    dataTable = null;
  }
  nextTick(() => {
    if (filteredPackages.value.length > 0) {
      initDataTable();
    }
  });
});

// Helper functions
function getImageUrl(imagePath) {
  if (!imagePath) return '';
  // ถ้าเป็น path เต็ม ให้แปลงเป็น URL
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  return `${API_BASE_URL}/uploads/${imagePath}`;
}

function formatPhone(phone) {
  if (!phone) return '-';
  // แปลงเป็นรูปแบบ 0xx-xxx-xxxx
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Parse raw description/rawText for recipient, phone, address, datetime
function parsePackageText(text) {
  if (!text) return {};
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const joined = lines.join('\n');
  const result = {};

  // Extract date (YYYY-MM-DD) and time (HH:MM:SS) if present
  const dateMatch = joined.match(/(\d{4}-\d{2}-\d{2})/);
  const timeMatch = joined.match(/(\d{2}:\d{2}:\d{2})/);
  if (dateMatch) result.date = dateMatch[1];
  if (timeMatch) result.time = timeMatch[1];

  // Extract phone (Thai formats) - look for sequences of 9-11 digits
  const phoneMatch = joined.match(/(\+?\d[\d\-\s]{8,}\d)/);
  if (phoneMatch) {
    const digits = phoneMatch[1].replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 13) result.phone = digits;
  }

  // Recipient: look for 'Receiver:' or 'Receiver' or 'ผู้รับ' or 'Receiver:' in English
  const recLine = lines.find(l => /Receiver\s*:|ผู้รับ\s*:|Receiver\s+/i.test(l));
  if (recLine) {
    const m = recLine.split(/:\s*/).slice(1).join(':').trim();
    if (m) result.recipient = m;
  } else {
    // fallback: look for line with Thai personal name (two words) — as a heuristic
    const thaiNameLine = lines.find(l => /[ก-๙]+\s+[ก-๙]+/.test(l));
    if (thaiNameLine) result.recipient = thaiNameLine;
  }

  // Address: take lines after recipient line up to Phone or Date
  if (result.recipient) {
    const idx = lines.findIndex(l => l.includes(result.recipient));
    if (idx >= 0) {
      const addressLines = [];
      for (let i = idx + 1; i < lines.length; i++) {
        const l = lines[i];
        if (/Phone\s*:|LAZADA Order Number|\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/i.test(l)) break;
        // stop at obvious English header words
        if (/Sender\s*:|Receiver\s*:|Phone\s*:|LAZADA|Order Number/i.test(l)) break;
        addressLines.push(l);
      }
      if (addressLines.length) result.address = addressLines.join(' ');
    }
  }

  // If no address, try to get any line that looks like address (contains numbers + words)
  if (!result.address) {
    const addrLine = lines.find(l => /\d{1,4}\s+.+/.test(l));
    if (addrLine) result.address = addrLine;
  }

  return result;
}

function getPackageRecipient(pkg) {
  if (pkg.recipientName) return pkg.recipientName;
  if (pkg.recipient) return pkg.recipient;
  if (pkg.recipient_name) return pkg.recipient_name;
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = parsePackageText(text);
  return parsed.recipient || 'ไม่ระบุ';
}

function getPackagePhone(pkg) {
  if (pkg.phone) return pkg.phone;
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = parsePackageText(text);
  return parsed.phone || null;
}

function getPackagePhoneDigits(pkg) {
  const phone = getPackagePhone(pkg) || '';
  return phone.replace(/\D/g, '');
}

function getPackageAddress(pkg) {
  // Prefer explicit package address (unless it's the 'ไม่ระบุ' placeholder), then tenant.address (from backend), then parsed text
  if (pkg.address && pkg.address !== 'ไม่ระบุ') return pkg.address;
  if (pkg.tenant && (pkg.tenant.address || pkg.tenant_address)) return pkg.tenant.address || pkg.tenant_address;
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = parsePackageText(text);
  return parsed.address || 'ไม่ระบุ';
}

function getPackageAddressShort(pkg, max = 30) {
  const full = getPackageAddress(pkg);
  if (!full || full === 'ไม่ระบุ') return 'ไม่ระบุ';
  if (full.length <= max) return full;
  return full.slice(0, max).trim() + '...';
}

function getPackageDateTime(pkg) {
  // prefer explicit scannedAt / created_at, fallback to parsed date+time
  const dt = pkg.scannedAt || pkg.scanned_at || pkg.created_at || null;
  if (dt) return formatDateTime(dt);
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = parsePackageText(text);
  if (parsed.date) {
    const combined = parsed.time ? `${parsed.date}T${parsed.time}` : `${parsed.date}`;
    // try to build Date
    const d = new Date(combined);
    if (!isNaN(d.getTime())) return formatDateTime(d.toISOString());
  }
  return null;
}

function openImageModal(pkg) {
  selectedImage.value = pkg;
}

function closeImageModal() {
  selectedImage.value = null;
}

function toggleFilter(filter) {
  activeFilter.value = activeFilter.value === filter ? null : filter;
}

function initDataTable() {
  if (dataTable) {
    dataTable.destroy();
  }
  
  nextTick(() => {
    dataTable = new DataTable('#packagesTable', {
      language: {
        search: 'ค้นหา:',
        lengthMenu: 'แสดง _MENU_ รายการ',
        info: 'แสดง _START_ - _END_ จาก _TOTAL_ รายการ',
        paginate: {
          first: '«',
          last: '»',
          next: '›',
          previous: '‹',
        },
        zeroRecords: 'ไม่พบข้อมูล',
        emptyTable: 'ไม่มีข้อมูล',
      },
      pageLength: 10,
      pagingType: 'simple', // show only Previous / Next buttons
      columnDefs: [
        // Disable ordering on image, status and action columns (indices after reduction)
        { orderable: false, targets: [1, 4, 5] },  // ภาพ, สถานะ, การกระทำ
      ],
      // drawCallback intentionally left empty to avoid inline page indicator
      drawCallback: function () {
        // page indicator removed per UI preference
      }
    });
  });
}

async function fetchPackages() {
  loading.value = true;
  try {
    packages.value = await packageAPI.getAll();
    initDataTable();
  } catch (error) {
    console.error('Error fetching packages', error);
    await showAlert(errorMessages.failedToFetch, 'เกิดข้อผิดพลาด');
  } finally {
    loading.value = false;
  }
}

async function fetchTenants() {
  try {
    tenants.value = await tenantAPI.getAll();
  } catch (error) {
    console.error('Error fetching tenants', error);
  }
}

async function matchTenant(pkg) {
  matchingPackage.value = pkg;
  if (tenants.value.length === 0) {
    await fetchTenants();
  }
}

function cancelMatchTenant() {
  matchingPackage.value = null;
}

async function confirmMatchTenant(tenantId) {
  try {
    if (!matchingPackage.value) return;
    
    const selectedTenant = tenants.value.find(t => t.id === tenantId);
    await packageAPI.matchTenant(matchingPackage.value.id, tenantId);
    
    // Update local data in real-time
    const packageIndex = packages.value.findIndex(p => p.id === matchingPackage.value.id);
    if (packageIndex !== -1 && selectedTenant) {
      packages.value[packageIndex].tenant = {
        id: selectedTenant.id,
        name: selectedTenant.name,
        tag: selectedTenant.tag
      };
    }
    
    await showAlert('จับคู่สำเร็จ', 'สำเร็จ');
    matchingPackage.value = null;
  } catch (error) {
    console.error('Error matching tenant', error);
    await showAlert('เกิดข้อผิดพลาดในการจับคู่', 'เกิดข้อผิดพลาด');
  }
}

// WebSocket connection for live updates
function connectWebSocket() {
  if (ws) {
    ws.close();
  }
  
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => {
    console.log('[WebSocket] Connected to server');
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === 'new_package') {
        console.log('[WebSocket] New package received:', message.data);
        // Refresh the packages list
        fetchPackages();
      }
    } catch (e) {
      console.error('[WebSocket] Error parsing message:', e);
    }
  };
  
  ws.onclose = () => {
    console.log('[WebSocket] Disconnected, reconnecting in 3s...');
    setTimeout(connectWebSocket, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
  };
}

onMounted(() => {
  fetchPackages();
  connectWebSocket();
});

onUnmounted(() => {
  if (ws) {
    ws.close();
    ws = null;
  }
});
</script>

<style scoped>
.apple-section {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-content h2 {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.007em;
  color: #1D1D1F;
  margin: 0;
}

.header-subtitle {
  font-size: 15px;
  color: #86868B;
  margin: 4px 0 0 0;
}

.header-stats {
  display: flex;
  gap: 12px;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-pill.matched {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.stat-pill.matched:hover:not(.active) {
  background: rgba(52, 199, 89, 0.25);
}

.stat-pill.matched.active {
  background: #34C759;
  color: #FFFFFF;
}

.stat-pill.unmatched {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.stat-pill.unmatched:hover:not(.active) {
  background: rgba(255, 149, 0, 0.25);
}

.stat-pill.unmatched.active {
  background: #FF9500;
  color: #FFFFFF;
}

.stat-pill.reset {
  background: rgba(220, 220, 220, 0.5);
  color: #555;
}

.stat-pill.reset:hover {
  background: rgba(220, 220, 220, 0.8);
}

.stat-icon {
  width: 16px;
  height: 16px;
}

.table-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
  color: #86868B;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #E5E5EA;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.apple-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.apple-table thead {
  background: #F2F2F7;
}

.apple-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.008em;
  color: #86868B;
  text-transform: uppercase;
  border-bottom: 1px solid #E5E5EA;
}

.apple-table td {
  padding: 14px 16px;
  font-size: 15px;
  color: #1D1D1F;
  border-bottom: 1px solid #E5E5EA;
  vertical-align: middle;
}

.apple-table tbody tr {
  transition: background 0.2s;
}

.apple-table tbody tr:hover {
  background: #F2F2F7;
}

.apple-table tbody tr:last-child td {
  border-bottom: none;
}

.center {
  text-align: center;
}

.recipient-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipient-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9500, #FF3B30);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.recipient-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recipient-name {
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recipient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.meta-phone,
.meta-address,
.meta-time {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-phone a {
  color: #007AFF;
  text-decoration: none;
}

.meta-phone a:active {
  opacity: 0.7;
}

.address-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tenant-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
}

.tenant-badge.matched {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.tenant-badge.pending {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.badge-icon {
  width: 14px;
  height: 14px;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.status-badge.warning {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn.match {
  background: #007AFF;
  color: #FFFFFF;
}

.action-btn.match:hover:not(:disabled) {
  background: #0056CC;
  transform: scale(1.02);
}

.action-btn.match:disabled {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
  cursor: default;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #C7C7CC;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 21px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 15px;
  color: #86868B;
  margin: 0;
}

/* New styles for package image and phone */
.image-cell {
  width: 70px;
  text-align: center;
}

.package-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #E5E5EA;
}

.package-thumbnail:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.no-image {
  color: #86868B;
}

.phone-cell {
  white-space: nowrap;
}

.phone-link {
  color: #007AFF;
  text-decoration: none;
  font-weight: 500;
}

.phone-link:hover {
  text-decoration: underline;
}

.time-cell {
  white-space: nowrap;
  font-size: 13px;
  color: #666;
}

/* Image Modal */
.image-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.image-modal {
  background: white;
  border-radius: 16px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.8);
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  display: block;
}

.modal-info {
  padding: 20px;
  background: #f5f5f7;
}

.modal-info h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #1D1D1F;
}

.modal-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #666;
}

/* Packages notice */
.packages-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0,0,0,0.03);
  border-radius: 12px;
  margin-top: 12px;
  color: #444;
  font-size: 14px;
}

.packages-notice .notice-icon {
  width: 20px;
  height: 20px;
  color: #FF9500;
}

.packages-notice .notice-text strong {
  color: #007AFF;
}

/* Tenant Selection */
.tenant-selection-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.tenant-selection-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #E5E5EA;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  gap: 12px;
}

.tenant-selection-item:hover {
  background: #f5f5f7;
  border-color: #007AFF;
}

.tenant-selection-item:active {
  background: #e8e8ed;
}

.tenant-selection-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #34C759);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  font-size: 18px;
}

.tenant-selection-info {
  flex: 1;
  min-width: 0;
}

.tenant-selection-name {
  font-size: 16px;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 4px;
}

.tenant-selection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.selection-checkmark {
  width: 20px;
  height: 20px;
  color: #34C759;
  flex-shrink: 0;
}

.tag-cell {
  white-space: nowrap;
}

.tag-badge {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
}

.no-tag {
  color: #C7C7CC;
}

@media (max-width: 768px) {
  .apple-section {
    padding: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-content h2 {
    font-size: 22px;
  }

  .header-stats {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .stat-pill {
    width: 100%;
    justify-content: center;
  }

  .table-card {
    padding: 12px;
    border-radius: 12px;
    overflow: visible;
  }

  /* ซ่อน table header บนมือถือ */
  .apple-table thead {
    display: none;
  }

  /* แปลง table เป็น card layout */
  .apple-table,
  .apple-table tbody {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .apple-table tbody tr {
    display: block;
    background: #FFFFFF;
    border: 1px solid #E5E5EA;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  .apple-table tbody tr:hover {
    background: #FFFFFF;
  }

  .apple-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border: none;
    font-size: 14px;
    text-align: left;
  }

  .apple-table td:before {
    content: attr(data-label);
    font-weight: 600;
    font-size: 12px;
    color: #86868B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    margin-right: 12px;
  }

  .apple-table td:not(:last-child) {
    border-bottom: 1px solid #F2F2F7;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .recipient-info {
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    width: auto;
    gap: 8px;
  }

  .recipient-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .recipient-main {
    flex: 1;
    min-width: 0;
    gap: 2px;
  }

  .recipient-name {
    font-size: 13px;
    font-weight: 600;
  }

  .recipient-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: 11px;
    gap: 4px;
  }

  .meta-phone,
  .meta-address,
  .meta-time {
    display: inline;
  }

  .action-btn {
    padding: 8px;
    min-width: 36px;
    height: 36px;
  }

  .package-thumbnail {
    width: 50px;
    height: 50px;
  }

  .image-modal {
    max-width: 95vw;
    padding: 16px;
  }
  
  .image-modal img {
    max-height: 60vh;
  }
}
</style>
