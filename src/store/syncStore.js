import { create } from 'zustand';

export const useSyncStore = create((set) => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  configured: false,
  enabled: false,
  queueLength: 0,
  syncStatus: 'idle',
  lastSyncAt: null,
  lastPullAt: null,
  lastError: '',
  listenerActive: false,
  setOnline(isOnline) {
    set({ isOnline });
  },
  setConfigured(configured) {
    set({ configured });
  },
  setEnabled(enabled) {
    set({ enabled });
  },
  setQueueLength(queueLength) {
    set({ queueLength });
  },
  setSyncStatus(syncStatus) {
    set({ syncStatus });
  },
  setLastSyncAt(lastSyncAt) {
    set({ lastSyncAt, lastError: '' });
  },
  setLastPullAt(lastPullAt) {
    set({ lastPullAt });
  },
  setLastError(lastError) {
    set({ lastError, syncStatus: 'error' });
  },
  setListenerActive(listenerActive) {
    set({ listenerActive });
  },
  reset() {
    set({
      queueLength: 0,
      syncStatus: 'idle',
      lastSyncAt: null,
      lastPullAt: null,
      lastError: '',
      listenerActive: false
    });
  }
}));
