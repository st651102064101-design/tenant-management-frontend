<template>
  <section class="apple-section">
    <header class="section-header">
      <div class="header-content">
        <h2>รายงานและสถิติ</h2>
        <p class="header-subtitle">ภาพรวมข้อมูลในระบบ (อัปเดตสด)</p>
      </div>
    </header>

    <!-- Statistics Cards -->
    <div v-if="statistics" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics.totalTenants }}</span>
          <span class="stat-label">ผู้เช่าทั้งหมด</span>
        </div>
        <div class="stat-trend up">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
          <span>Active</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics.totalPackages }}</span>
          <span class="stat-label">พัสดุทั้งหมด</span>
        </div>
        <div class="stat-trend up">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
          <span>+{{ statistics.totalPackages }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics.matchedPackages }}</span>
          <span class="stat-label">จับคู่แล้ว</span>
        </div>
        <div class="stat-trend up success">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5z"/>
          </svg>
          <span>{{ matchRate }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ statistics.unmatchedPackages }}</span>
          <span class="stat-label">รอจับคู่</span>
        </div>
        <div class="stat-trend" :class="statistics.unmatchedPackages > 0 ? 'warning' : 'success'">
          <svg viewBox="0 0 24 24" fill="currentColor" v-if="statistics.unmatchedPackages > 0">
            <path d="M17 10l-5 5-5-5z"/>
          </svg>
          <svg viewBox="0 0 24 24" fill="currentColor" v-else>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>{{ statistics.unmatchedPackages > 0 ? 'Pending' : 'Done' }}</span>
        </div>
      </div>
    </div>

    <!-- Recent Packages -->
    <div v-if="recentPackages.length" class="recent-packages-card">
      <div class="recent-header">
        <h3>พัสดุที่เพิ่มล่าสุด</h3>
        <span class="recent-count">{{ recentPackages.length }} รายการ</span>
      </div>
      
      <div class="recent-packages-grid">
        <div v-for="pkg in recentPackages" :key="pkg.id" class="recent-package-item">
          <div class="package-icon">
            <img v-if="getPackageImageRaw(pkg)" :src="getImageUrl(getPackageImageRaw(pkg))" alt="พัสดุ" class="package-thumb" />
            <svg v-else viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/>
            </svg>
          </div>
          <div class="package-details">
            <h4>{{ getPackageRecipient(pkg) }}</h4>
            <div class="package-meta">
              <span v-if="getPackagePhone(pkg)" class="package-phone">📞 <a :href="'tel:' + getPackagePhoneDigits(pkg)">{{ formatPhoneShort(getPackagePhone(pkg)) }}</a></span>
              <span class="package-address" :title="getPackageAddress(pkg)">📍 {{ getPackageAddressShort(pkg) }}</span>
              <span class="package-date">{{ getPackageDate(pkg) }}</span>
              <span v-if="pkg.tenant" class="package-tenant">{{ getPackageTenantLabel(pkg) }}</span>
              <span v-else class="package-unmatched">รอจับคู่</span>
            </div>
          </div>
          <div class="package-status">
            <span v-if="pkg.tenant" class="status-dot matched"></span>
            <span v-else class="status-dot unmatched"></span>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { reportAPI, tenantAPI, packageAPI } from '../api.js';
import { errorMessages, WS_URL, API_BASE_URL } from '../config.js';
import { useDialog } from '../composables/useDialog.js';
import $ from 'jquery';
import DataTable from 'datatables.net-dt';

const { alert: showAlert } = useDialog();

const reports = ref([]);
const statistics = ref(null);
const recentPackages = ref([]);
const loading = ref(false);
let dataTable = null;
let ws = null;

const matchRate = computed(() => {
  if (!statistics.value || statistics.value.totalPackages === 0) return 0;
  return Math.round((statistics.value.matchedPackages / statistics.value.totalPackages) * 100);
});

function initDataTable() {
  if (dataTable) {
    dataTable.destroy();
  }
  
  nextTick(() => {
    dataTable = new DataTable('#reportsTable', {
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
      columnDefs: [
        { orderable: false, targets: 4 },
      ],
    });
  });
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
    second: '2-digit',
  });
}

// Helpers for scanned package fields (support multiple API field names)
function getPackageDateRaw(pkg) {
  return pkg.date_received || pkg.scannedAt || pkg.scanned_at || pkg.created_at || null;
}

function getPackageDate(pkg) {
  const raw = getPackageDateRaw(pkg);
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return formatDateTime(d.toISOString());
    return formatDate(raw);
  }

  // Fallback: parse from description/raw text
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = typeof parsePackageTextMini === 'function' ? parsePackageTextMini(text) : {};
  if (parsed.date) {
    const combined = parsed.time ? `${parsed.date}T${parsed.time}` : parsed.date;
    const d2 = new Date(combined);
    if (!isNaN(d2.getTime())) return formatDateTime(d2.toISOString());
    return formatDate(parsed.date);
  }

  return '-';
}

function getPackageRecipient(pkg) {
  return pkg.recipientName || pkg.recipient || pkg.recipient_name || (pkg.tenant && pkg.tenant.name) || 'ไม่ระบุ';
}

function getPackageDescription(pkg) {
  return pkg.description || pkg.rawText || pkg.raw_text || pkg.address || 'ไม่มีรายละเอียด';
}

function getPackageTenantLabel(pkg) {
  if (!pkg.tenant) return null;
  const name = pkg.tenant.name || pkg.tenantName || '';
  const room = pkg.tenant.room || pkg.tenant_room || pkg.tenant.room_number || '';
  return room ? `${name} (${room})` : name;
}

function getTypeIcon(type) {
  const icons = {
    monthly: '📅',
    maintenance: '🔧',
    collection: '💰',
    inspection: '🔍',
    incident: '⚠️',
  };
  return icons[type] || '📋';
}

// Image helpers for recent packages
function getPackageImageRaw(pkg) {
  return pkg.imagePath || pkg.image_path || pkg.imageUrl || pkg.image || null;
}

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/uploads/${path}`;
}

// Parse raw description/rawText to extract phone, address, date/time (lightweight)
function parsePackageTextMini(text) {
  if (!text) return {};
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const joined = lines.join('\n');
  const result = {};

  const dateMatch = joined.match(/(\d{4}-\d{2}-\d{2})/);
  const timeMatch = joined.match(/(\d{2}:\d{2}:\d{2})/);
  if (dateMatch) result.date = dateMatch[1];
  if (timeMatch) result.time = timeMatch[1];

  const phoneMatch = joined.match(/(\+?\d[\d\-\s]{8,}\d)/);
  if (phoneMatch) {
    const digits = phoneMatch[1].replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 13) result.phone = digits;
  }

  // Attempt to find an address-like line (contains number and Thai/English words)
  const addrLine = lines.find(l => /\d/.test(l) && /[ก-๙A-Za-z]/.test(l));
  if (addrLine) result.address = addrLine;

  return result;
}

function getPackagePhone(pkg) {
  if (pkg.phone) return pkg.phone;
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = parsePackageTextMini(text);
  return parsed.phone || null;
}

function getPackagePhoneDigits(pkg) {
  const phone = getPackagePhone(pkg) || '';
  return phone.replace(/\D/g, '');
}

function formatPhoneShort(phone) {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  return phone;
}

function getPackageAddress(pkg) {
  // Prefer explicit package address (unless it's the 'ไม่ระบุ' placeholder), then tenant.address (from backend), then parsed text
  if (pkg.address && pkg.address !== 'ไม่ระบุ') return pkg.address;
  if (pkg.tenant && (pkg.tenant.address || pkg.tenant_address)) return pkg.tenant.address || pkg.tenant_address;
  const text = pkg.description || pkg.rawText || pkg.raw_text || '';
  const parsed = parsePackageTextMini(text);
  return parsed.address || 'ไม่ระบุ';
}

function getPackageAddressShort(pkg, max = 30) {
  const full = getPackageAddress(pkg);
  if (!full || full === 'ไม่ระบุ') return 'ไม่ระบุ';
  if (full.length <= max) return full;
  return full.slice(0, max).trim() + '...';
}

function getReportTypeLabel(type) {
  const labels = {
    monthly: 'รายเดือน',
    maintenance: 'ซ่อมแซม',
    collection: 'เก็บค่าเช่า',
    inspection: 'ตรวจสอบ',
    incident: 'เหตุการณ์',
  };
  return labels[type] || type;
}

function getReportStatus(type) {
  const statuses = {
    monthly: 'สมบูรณ์',
    maintenance: 'เสร็จสิ้น',
    collection: 'เสร็จสิ้น',
    inspection: 'เสร็จสิ้น',
    incident: 'รอดำเนินการ',
  };
  return statuses[type] || 'สมบูรณ์';
}

function getStatusClass(type) {
  return type === 'incident' ? 'warning' : 'success';
}

async function fetchStatistics() {
  try {
    const [tenants, packages] = await Promise.all([
      tenantAPI.getAll(),
      packageAPI.getAll(),
    ]);

    const total_packages = packages.length;
    const matched_packages = packages.filter((p) => p.tenant).length;
    const unmatched_packages = total_packages - matched_packages;

    statistics.value = {
      totalTenants: tenants.length,
      totalPackages: total_packages,
      matchedPackages: matched_packages,
      unmatchedPackages: unmatched_packages,
    };
  } catch (error) {
    console.error('Error fetching statistics', error);
  }
}

async function fetchRecentPackages() {
  try {
    const packages = await packageAPI.getAll();
    // เรียงตามวันที่ล่าสุดและเอา 5 รายการแรก (รองรับหลายชื่อฟิลด์วันที่)
    const sortedPackages = packages.sort((a, b) => {
      const da = new Date(getPackageDateRaw(a) || 0);
      const db = new Date(getPackageDateRaw(b) || 0);
      return db - da;
    });
    recentPackages.value = sortedPackages.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent packages', error);
  }
}

async function fetchReports() {
  loading.value = true;
  try {
    reports.value = await reportAPI.getAll();
    await Promise.all([
      fetchStatistics(),
      fetchRecentPackages()
    ]);
    initDataTable();
  } catch (error) {
    console.error('Error fetching reports', error);
    await showAlert(errorMessages.failedToFetch, 'เกิดข้อผิดพลาด');
  } finally {
    loading.value = false;
  }
}

async function exportToCSV() {
  if (!reports.value.length) {
    await showAlert('ไม่มีข้อมูลให้ส่งออก', 'แจ้งเตือน');
    return;
  }

  const headers = ['ลำดับ', 'ประเภท', 'วันที่', 'รายละเอียด', 'สถานะ'];
  const rows = reports.value.map((report, index) => [
    index + 1,
    getReportTypeLabel(report.type),
    formatDate(report.date),
    report.description,
    getReportStatus(report.type),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `รายงาน-${new Date().toISOString().slice(0, 10)}.csv`);
  link.click();
}

function printReport() {
  window.print();
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
        console.log('[WebSocket] New package, refreshing reports...');
        fetchReports();
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
  fetchReports();
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

.apple-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.apple-btn.secondary {
  background: #F2F2F7;
  color: #007AFF;
}

.apple-btn.secondary:hover {
  background: #E5E5EA;
}

.apple-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
  color: #FFFFFF;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #007AFF, #5AC8FA);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #5856D6, #AF52DE);
}

.stat-icon.green {
  background: linear-gradient(135deg, #34C759, #30D158);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #FF9500, #FF3B30);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.003em;
  color: #1D1D1F;
  display: block;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #86868B;
  display: block;
  margin-top: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
}

.stat-trend svg {
  width: 14px;
  height: 14px;
}

.stat-trend.up {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.stat-trend.success {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.stat-trend.warning {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
}

/* Recent Packages */
.recent-packages-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06);
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recent-header h3 {
  font-size: 21px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
}

.recent-count {
  background: rgba(0, 122, 255, 0.15);
  color: #007AFF;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
}

.recent-packages-grid {
  display: grid;
  gap: 12px;
}

.recent-package-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: #F8F9FA;
  transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.recent-package-item:hover {
  background: #F2F2F7;
  transform: translateY(-2px);
}

.package-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #5856D6, #AF52DE);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.package-icon svg {
  width: 20px;
  height: 20px;
}

.package-thumb {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  display: block;
}

.package-details {
  flex: 1;
  min-width: 0;
}

.package-details h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 4px 0;
}

.package-desc {
  font-size: 13px;
  color: #86868B;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.package-date {
  font-size: 12px;
  color: #86868B;
}

.package-tenant {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
}

.package-unmatched {
  background: rgba(255, 149, 0, 0.15);
  color: #FF9500;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 500;
}

.package-status {
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-dot.matched {
  background: #34C759;
  box-shadow: 0 0 0 3px rgba(52, 199, 89, 0.15);
}

.status-dot.unmatched {
  background: #FF9500;
  box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.15);
}

/* Table Card */
.table-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  font-size: 21px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  background: #F2F2F7;
  color: #1D1D1F;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn svg {
  width: 16px;
  height: 16px;
}

.export-btn:hover {
  background: #E5E5EA;
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

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
}

.type-badge.monthly {
  background: rgba(0, 122, 255, 0.15);
  color: #007AFF;
}

.type-badge.maintenance {
  background: rgba(88, 86, 214, 0.15);
  color: #5856D6;
}

.type-badge.collection {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.type-badge.inspection {
  background: rgba(90, 200, 250, 0.15);
  color: #5AC8FA;
}

.type-badge.incident {
  background: rgba(255, 59, 48, 0.15);
  color: #FF3B30;
}

.type-icon {
  font-size: 14px;
}

.description-cell {
  max-width: 300px;
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

  .apple-btn {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 26px;
  }

  .recent-packages-card {
    padding: 16px;
    border-radius: 12px;
  }

  .recent-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .recent-package-item {
    padding: 12px;
    gap: 12px;
  }

  .package-icon {
    width: 40px;
    height: 40px;
  }

  .package-icon svg {
    width: 18px;
    height: 18px;
  }

  .package-details h4 {
    font-size: 15px;
  }

  .package-desc {
    font-size: 13px;
  }

  .package-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .table-card {
    padding: 12px;
    border-radius: 12px;
    overflow: visible;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
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

  .export-buttons {
    width: 100%;
  }

  .export-btn {
    flex: 1;
    justify-content: center;
  }
}

@media print {
  .section-header,
  .export-buttons,
  .apple-btn {
    display: none !important;
  }

  .apple-section {
    padding: 0;
  }

  .table-card {
    box-shadow: none;
    padding: 0;
  }

  .stats-grid {
    display: none;
  }
}
</style>
