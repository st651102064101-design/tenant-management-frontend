<template>
  <section class="apple-section">
    <header class="section-header">
      <div class="header-content">
        <h2>ผู้เช่าทั้งหมด</h2>
        <p class="header-subtitle">จัดการข้อมูลผู้เช่าในระบบ</p>
      </div>
      <button @click="openCreateForm" class="apple-btn primary">
        <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        เพิ่มผู้เช่า
      </button>
    </header>

    <div class="table-card">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>กำลังโหลดข้อมูล...</span>
      </div>

      <table v-else-if="tenants.length" id="tenantsTable" class="apple-table display">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ชื่อผู้เช่า</th>
            <th>ที่อยู่</th>
            <th>ห้อง</th>
            <th>เบอร์โทร</th>
            <th>Tag</th>
            <th>พัสดุ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tenant, index) in tenants" :key="tenant.id">
            <td class="center" data-label="ลำดับ">{{ index + 1 }}</td>
            <td data-label="ชื่อผู้เช่า">
              <div class="tenant-info">
                <div class="tenant-avatar">{{ tenant.name.charAt(0) }}</div>
                <span class="tenant-name">{{ tenant.name }}</span>
              </div>
            </td>
            <td class="address-cell" data-label="ที่อยู่">{{ tenant.address }}</td>
            <td class="center" data-label="ห้อง">
              <span class="room-badge">{{ tenant.room }}</span>
            </td>
            <td data-label="เบอร์โทร">{{ tenant.phone }}</td>
            <td class="tag-cell" data-label="Tag">
              <span v-if="tenant.tag" class="tag-badge">{{ tenant.tag }}</span>
              <span v-else class="no-tag">-</span>
            </td>
            <td class="center" data-label="พัสดุ">
              <button 
                @click="viewPackages(tenant)" 
                :class="['package-badge', tenant.packageCount > 0 ? 'has-items' : 'empty']"
              >
                {{ tenant.packageCount }} ชิ้น
              </button>
            </td>
            <td data-label="จัดการ">
              <div class="actions">
                <button class="action-btn edit" @click="editTenant(tenant)" title="แก้ไข">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button class="action-btn delete" @click="deleteTenant(tenant)" title="ลบ">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <h3>ไม่พบข้อมูลผู้เช่า</h3>
        <p>เริ่มต้นเพิ่มผู้เช่าคนแรกของคุณ</p>
        <button @click="openCreateForm" class="apple-btn primary">เพิ่มผู้เช่า</button>
      </div>
    </div>

    <TenantForm
      v-if="showForm"
      :tenant="editingTenant"
      @close="closeForm"
      @saved="reloadTenants"
    />

    <div v-if="showPackageModal" class="modal-overlay" @click="closePackageModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <svg viewBox="0 0 24 24" fill="currentColor" class="modal-icon">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/>
            </svg>
            <div>
              <h3>พัสดุของ {{ selectedTenant?.name }}</h3>
              <p>{{ selectedTenantPackages.length }} รายการ</p>
            </div>
          </div>
          <button class="close-btn" @click="closePackageModal">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedTenantPackages.length" class="packages-grid">
            <div v-for="pkg in selectedTenantPackages" :key="pkg.id" class="package-card">
              <div class="package-header">
                <span class="package-status delivered">ได้รับแล้ว</span>
                <span class="package-date">{{ formatDate(pkg.created_at) }}</span>
              </div>
              <div class="package-detail">
                <label>ผู้รับ</label>
                <span>{{ pkg.recipientName }}</span>
              </div>
              <div class="package-detail">
                <label>ที่อยู่</label>
                <span>{{ pkg.address }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-packages">
            <svg viewBox="0 0 24 24" fill="currentColor" class="empty-icon">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            </svg>
            <p>ไม่มีพัสดุสำหรับผู้เช่ารายนี้</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import TenantForm from './TenantForm.vue';
import { tenantAPI, packageAPI } from '../api.js';
import { errorMessages, confirmations } from '../config.js';
import { useDialog } from '../composables/useDialog.js';
import $ from 'jquery';
import DataTable from 'datatables.net-dt';

const { alert: showAlert, confirm: showConfirm } = useDialog();

const tenants = ref([]);
const showForm = ref(false);
const editingTenant = ref(null);
const showPackageModal = ref(false);
const selectedTenant = ref(null);
const selectedTenantPackages = ref([]);
const loading = ref(false);
let dataTable = null;

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initDataTable() {
  if (dataTable) {
    dataTable.destroy();
  }
  
  nextTick(() => {
    dataTable = new DataTable('#tenantsTable', {
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
        { orderable: false, targets: [5, 6] },
      ],
    });
  });
}

async function fetchTenants() {
  loading.value = true;
  try {
    const allTenants = await tenantAPI.getAll();
    const allPackages = await packageAPI.getAll();

    tenants.value = allTenants.map((tenant) => {
      const packageCount = allPackages.filter((pkg) => pkg.tenant && pkg.tenant.id === tenant.id).length;
      return { ...tenant, packageCount };
    });
    
    initDataTable();
  } catch (error) {
    console.error('Error fetching tenants:', error);
    await showAlert(errorMessages.failedToFetch, 'เกิดข้อผิดพลาด');
  } finally {
    loading.value = false;
  }
}

async function viewPackages(tenant) {
  selectedTenant.value = tenant;
  try {
    const allPackages = await packageAPI.getAll();
    selectedTenantPackages.value = allPackages.filter((pkg) => pkg.tenant && pkg.tenant.id === tenant.id);
    showPackageModal.value = true;
  } catch (error) {
    console.error('Error fetching packages:', error);
    await showAlert('เกิดข้อผิดพลาดในการโหลดพัสดุ', 'เกิดข้อผิดพลาด');
  }
}

function closePackageModal() {
  showPackageModal.value = false;
  selectedTenant.value = null;
  selectedTenantPackages.value = [];
}

function openCreateForm() {
  editingTenant.value = null;
  showForm.value = true;
}

function editTenant(tenant) {
  editingTenant.value = { ...tenant };
  showForm.value = true;
}

async function deleteTenant(tenant) {
  const confirmed = await showConfirm(confirmations.deleteTenant, 'ยืนยันการลบ');
  if (!confirmed) return;
  
  tenantAPI
    .delete(tenant.id)
    .then(() => fetchTenants())
    .catch(async (error) => {
      console.error(error);
      await showAlert(errorMessages.failedToDelete, 'เกิดข้อผิดพลาด');
    });
}

function reloadTenants() {
  fetchTenants();
}

function closeForm() {
  showForm.value = false;
  editingTenant.value = null;
}

onMounted(fetchTenants);
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

.apple-btn.primary {
  background: #007AFF;
  color: #FFFFFF;
}

.apple-btn.primary:hover {
  background: #0056CC;
  transform: scale(1.02);
}

.btn-icon {
  width: 18px;
  height: 18px;
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

.tenant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF, #5856D6);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.tenant-name {
  font-weight: 500;
}

.address-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
}

.package-badge {
  padding: 6px 14px;
  border: none;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.package-badge.has-items {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.package-badge.has-items:hover {
  background: rgba(52, 199, 89, 0.25);
}

.package-badge.empty {
  background: #E5E5EA;
  color: #86868B;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.action-btn.edit {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.action-btn.edit:hover {
  background: rgba(0, 122, 255, 0.2);
  transform: scale(1.05);
}

.action-btn.delete {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.action-btn.delete:hover {
  background: rgba(255, 59, 48, 0.2);
  transform: scale(1.05);
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
  margin: 0 0 24px 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: #FFFFFF;
  border-radius: 20px;
  max-width: 560px;
  width: 100%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E5EA;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  width: 40px;
  height: 40px;
  color: #007AFF;
}

.modal-title h3 {
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
}

.modal-title p {
  font-size: 13px;
  color: #86868B;
  margin: 2px 0 0 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #E5E5EA;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: #86868B;
}

.close-btn:hover {
  background: #D1D1D6;
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

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(85vh - 80px);
}

.packages-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.package-card {
  background: #F2F2F7;
  border-radius: 12px;
  padding: 16px;
}

.package-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.package-status {
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
}

.package-status.delivered {
  background: rgba(52, 199, 89, 0.15);
  color: #34C759;
}

.package-date {
  font-size: 12px;
  color: #86868B;
}

.package-detail {
  margin-bottom: 8px;
}

.package-detail:last-child {
  margin-bottom: 0;
}

.package-detail label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #86868B;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.package-detail span {
  font-size: 14px;
  color: #1D1D1F;
}

.no-packages {
  text-align: center;
  padding: 40px;
}

.no-packages .empty-icon {
  width: 48px;
  height: 48px;
}

.no-packages p {
  font-size: 15px;
  color: #86868B;
  margin: 16px 0 0 0;
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

  .header-subtitle {
    font-size: 13px;
  }

  .apple-btn {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
    font-size: 15px;
  }

  .table-card {
    padding: 12px;
    border-radius: 16px;
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

  .tenant-info,
  .actions {
    width: auto;
  }

  .tenant-avatar {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .tenant-name {
    font-size: 14px;
  }

  .room-badge,
  .tag-badge {
    padding: 4px 10px;
    font-size: 12px;
  }

  .modal-content {
    margin: 12px;
    max-height: 90vh;
    border-radius: 20px;
  }

  .modal-header h3 {
    font-size: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
