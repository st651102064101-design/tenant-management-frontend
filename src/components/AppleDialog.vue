<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="apple-dialog-overlay" @click="handleOverlayClick">
        <div class="apple-dialog" @click.stop>
          <div v-if="title" class="dialog-title">{{ title }}</div>
          <div class="dialog-message">{{ message }}</div>
          <div class="dialog-buttons">
            <button 
              v-if="type === 'confirm'" 
              class="dialog-btn dialog-btn-cancel" 
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button 
              class="dialog-btn dialog-btn-confirm" 
              :class="{ 'dialog-btn-single': type === 'alert' }"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const title = ref('');
const message = ref('');
const type = ref('alert'); // 'alert' or 'confirm'
const confirmText = ref('ตกลง');
const cancelText = ref('ยกเลิก');
let resolvePromise = null;

const show = (options) => {
  return new Promise((resolve) => {
    title.value = options.title || '';
    message.value = options.message || '';
    type.value = options.type || 'alert';
    confirmText.value = options.confirmText || 'ตกลง';
    cancelText.value = options.cancelText || 'ยกเลิก';
    resolvePromise = resolve;
    visible.value = true;
  });
};

const handleConfirm = () => {
  visible.value = false;
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
};

const handleCancel = () => {
  visible.value = false;
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
};

const handleOverlayClick = () => {
  if (type.value === 'alert') {
    handleConfirm();
  }
};

defineExpose({ show });
</script>

<style scoped>
.apple-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.apple-dialog {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  min-width: 280px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: dialogBounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes dialogBounce {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.dialog-title {
  padding: 20px 20px 8px;
  font-size: 17px;
  font-weight: 600;
  color: #1d1d1f;
  text-align: center;
  letter-spacing: -0.02em;
}

.dialog-message {
  padding: 12px 20px 20px;
  font-size: 13px;
  color: #1d1d1f;
  text-align: center;
  line-height: 1.5;
  white-space: pre-line;
}

.dialog-buttons {
  display: flex;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
}

.dialog-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  font-size: 17px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.15s;
  color: #007aff;
  outline: none;
}

.dialog-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.dialog-btn-cancel {
  border-right: 0.5px solid rgba(0, 0, 0, 0.1);
  color: #007aff;
}

.dialog-btn-confirm {
  font-weight: 600;
  color: #007aff;
}

.dialog-btn-single {
  border-left: none;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .apple-dialog {
    background: rgba(44, 44, 46, 0.98);
  }
  
  .dialog-title,
  .dialog-message {
    color: #f5f5f7;
  }
  
  .dialog-buttons {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  .dialog-btn-cancel {
    border-right-color: rgba(255, 255, 255, 0.1);
  }
  
  .dialog-btn:active {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .apple-dialog {
    min-width: 270px;
  }
  
  .dialog-title {
    font-size: 16px;
  }
  
  .dialog-message {
    font-size: 12px;
  }
  
  .dialog-btn {
    font-size: 16px;
  }
}
</style>
