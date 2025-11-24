import { useEffect, useState } from 'react';

const STORAGE_KEY = 'last_stats_update';

export const setLastStatsUpdate = (date: Date) => {
  try {
    const iso = date.toISOString();
    localStorage.setItem(STORAGE_KEY, iso);
    // also dispatch a storage-like event for same-window listeners
    window.dispatchEvent(new CustomEvent('last-stats-update', { detail: iso }));
  } catch (e) {
    // ignore
  }
};

export const getLastStatsUpdate = (): Date | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch (e) {
    return null;
  }
};

// React hook to subscribe to updates
export const useLastStatsUpdate = () => {
  const [last, setLast] = useState<Date | null>(() => getLastStatsUpdate());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setLast(getLastStatsUpdate());
      }
    };

    const onCustom = (e: Event) => {
      const ev = e as CustomEvent<string>;
      if (ev?.detail) setLast(new Date(ev.detail));
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('last-stats-update', onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('last-stats-update', onCustom as EventListener);
    };
  }, []);

  return last;
};

// small convenience to update to now
export const touchLastStatsUpdate = () => setLastStatsUpdate(new Date());

