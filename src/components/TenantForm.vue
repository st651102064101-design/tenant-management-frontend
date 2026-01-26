<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title">
          <svg viewBox="0 0 24 24" fill="currentColor" class="modal-icon">
            <path v-if="form.id" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            <path v-else d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <h3>{{ form.id ? 'แก้ไขผู้เช่า' : 'เพิ่มผู้เช่าใหม่' }}</h3>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <form @submit.prevent="saveTenant" class="form-body">
        <div class="form-group">
          <label for="name">ชื่อผู้เช่า</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text"
            placeholder="กรอกชื่อผู้เช่า"
            required 
          />
        </div>
        
        <div class="form-group">
          <label for="address">ที่อยู่</label>
          <input 
            id="address"
            v-model="form.address" 
            type="text"
            placeholder="กรอกที่อยู่"
            required 
          />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="room">ห้อง</label>
            <input 
              id="room"
              v-model="form.room" 
              type="text"
              placeholder="เลขห้อง"
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="phone">เบอร์โทร</label>
            <input 
              id="phone"
              v-model="form.phone" 
              type="tel"
              placeholder="0xx-xxx-xxxx"
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label for="tag">Tag Telegram</label>
          <input 
            id="tag"
            v-model="form.tag" 
            type="text"
            placeholder="@username"
          />
          <small class="form-hint">ชื่อ Telegram สำหรับแจ้งเตือน เช่น @username</small>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">ยกเลิก</button>
          <button type="submit" class="btn-save">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            {{ form.id ? 'บันทึกการแก้ไข' : 'เพิ่มผู้เช่า' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { tenantAPI } from '../api.js';
import { errorMessages } from '../config.js';
import { useDialog } from '../composables/useDialog.js';

const { alert: showAlert } = useDialog();

const props = defineProps({
  tenant: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(['close', 'saved']);

const form = reactive({
  id: null,
  name: '',
  address: '',
  room: '',
  phone: '',
  tag: '',
});

watch(
  () => props.tenant,
  (newTenant) => {
    if (newTenant) {
      form.id = newTenant.id || null;
      form.name = newTenant.name || '';
      form.address = newTenant.address || '';
      form.room = newTenant.room || '';
      form.phone = newTenant.phone || '';
      form.tag = newTenant.tag || '';
    } else {
      form.id = null;
      form.name = '';
      form.address = '';
      form.room = '';
      form.phone = '';
      form.tag = '';
    }
  },
  { immediate: true }
);

async function saveTenant() {
  try {
    if (form.id) {
      await tenantAPI.update(form.id, form);
    } else {
      await tenantAPI.create(form);
    }
    emit('saved');
    emit('close');
  } catch (error) {
    console.error('Failed to save tenant:', error);
    await showAlert(errorMessages.failedToCreate, 'เกิดข้อผิดพลาด');
  }
}
</script>

<style scoped>
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
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  overflow: hidden;
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
  width: 32px;
  height: 32px;
  color: #007AFF;
}

.modal-title h3 {
  font-size: 17px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0;
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

.form-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.008em;
  color: #86868B;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #D1D1D6;
  border-radius: 12px;
  font-size: 17px;
  font-family: inherit;
  letter-spacing: -0.022em;
  background: #FFFFFF;
  color: #1D1D1F;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #007AFF;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
}

.form-group input::placeholder {
  color: #AEAEB2;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: #86868B;
  margin-top: 6px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #E5E5EA;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel {
  background: #F2F2F7;
  color: #1D1D1F;
  border: none;
}

.btn-cancel:hover {
  background: #E5E5EA;
}

.btn-save {
  background: #007AFF;
  color: #FFFFFF;
  border: none;
}

.btn-save:hover {
  background: #0056CC;
  transform: scale(1.02);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

@media (max-width: 768px) {
  .modal-content {
    margin: 12px;
    max-height: 92vh;
    border-radius: 20px;
    padding: 0;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-title h3 {
    font-size: 18px;
  }

  .modal-icon {
    width: 20px;
    height: 20px;
  }

  .form-body {
    padding: 16px;
  }

  .form-group label {
    font-size: 13px;
  }

  .form-group input,
  .form-group textarea {
    padding: 10px 14px;
    font-size: 15px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    padding: 16px;
    gap: 10px;
  }

  .form-actions button {
    width: 100%;
    justify-content: center;
    padding: 12px;
    font-size: 15px;
  }
}
</style>
