import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
  duration: number;
}

const DEFAULT_DURATION = 4500;

function createNotificationsStore() {
  const { subscribe, update } = writable<Toast[]>([]);

  function dismiss(id: string) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  function push(toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) {
    const id = crypto.randomUUID();
    const full: Toast = { duration: DEFAULT_DURATION, ...toast, id };
    update((toasts) => [...toasts, full]);
    if (full.duration > 0) {
      setTimeout(() => dismiss(id), full.duration);
    }
    return id;
  }

  return {
    subscribe,
    dismiss,
    success: (message: string, title?: string) => push({ kind: 'success', message, title }),
    error: (message: string, title?: string) =>
      push({ kind: 'error', message, title, duration: 6000 }),
    info: (message: string, title?: string) => push({ kind: 'info', message, title }),
    warning: (message: string, title?: string) => push({ kind: 'warning', message, title })
  };
}

export const notifications = createNotificationsStore();
