import { useState, useCallback } from 'react';
import { ToastAlert } from '../types/moviradar';

export function useToast() {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const showToast = useCallback((
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'info',
    title?: string,
    duration = 3500
  ) => {
    // Respuesta háptica con vibración en dispositivos móviles Android compatibles
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'success') {
          navigator.vibrate?.([40, 60, 40]);
        } else if (type === 'warning' || type === 'error') {
          navigator.vibrate?.([80, 80, 80]);
        } else {
          navigator.vibrate?.(40);
        }
      }
    } catch {
      // Ignorar si el navegador bloquea la vibración
    }

    const id = 'toast_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
    const newToast: ToastAlert = { id, message, type, title, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
  };
}
