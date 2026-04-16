// Toast utility using zustand
import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    // Prevent duplicate toasts with the same message and type
    set((state) => {
      const isDuplicate = state.toasts.some(t => t.message === message && t.type === type);
      if (isDuplicate) {
        return state;
      }
      return { toasts: [...state.toasts, { id, message, type }] };
    });
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 5000); // Increased timeout to 5 seconds
  },
  removeToast: (id) => set((state) => ({ 
    toasts: state.toasts.filter(t => t.id !== id) 
  }))
}));

export const useToast = () => {
  const { addToast } = useToastStore();
  return {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string, detail?: string) => {
      const fullMessage = detail ? `${message}: ${detail}` : message;
      addToast(fullMessage, 'error');
    },
    info: (message: string) => addToast(message, 'info'),
    warning: (message: string) => addToast(message, 'warning')
  };
};

export const toast = {
  success: (message: string) => console.log('Success:', message),
  error: (message: string) => console.error('Error:', message),
  info: (message: string) => console.info('Info:', message),
  warning: (message: string) => console.warn('Warning:', message)
};
