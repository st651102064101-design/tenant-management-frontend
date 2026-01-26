// Apple-style dialog composable
import { ref } from 'vue';

let dialogInstance = null;

export function setDialogInstance(instance) {
  dialogInstance = instance;
}

export function useDialog() {
  const alert = async (message, title = '') => {
    if (!dialogInstance) {
      console.error('Dialog instance not initialized');
      return window.alert(message);
    }
    
    return await dialogInstance.show({
      type: 'alert',
      title,
      message,
      confirmText: 'ตกลง'
    });
  };

  const confirm = async (message, title = '') => {
    if (!dialogInstance) {
      console.error('Dialog instance not initialized');
      return window.confirm(message);
    }
    
    return await dialogInstance.show({
      type: 'confirm',
      title,
      message,
      confirmText: 'ตกลง',
      cancelText: 'ยกเลิก'
    });
  };

  const customDialog = async (options) => {
    if (!dialogInstance) {
      console.error('Dialog instance not initialized');
      return false;
    }
    
    return await dialogInstance.show(options);
  };

  return {
    alert,
    confirm,
    customDialog
  };
}
