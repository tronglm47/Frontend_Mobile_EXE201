type ToastType = 'success' | 'error' | 'info';

type ToastEvent = {
  message: string;
  type: ToastType;
};

// Minimal event bus compatible with React Native (no Node deps)
const listeners: Set<(payload: ToastEvent) => void> = new Set();

export function showGlobalToast(message: string, type: ToastType = 'info') {
  const payload: ToastEvent = { message, type };
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch {}
  });
}

export function onGlobalToast(listener: (payload: ToastEvent) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}


