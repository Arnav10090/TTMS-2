import React, { useEffect, useState } from 'react';
import { Bell, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDateTimeDisplay, toStorageTimestamp } from '@/lib/datetime';
import { useLocation } from 'react-router-dom';
import { toast as showToast } from '@/hooks/use-toast';

type Alarm = {
  id: string | number;
  timestamp: string;
  severity: string;
  equipment: string;
  type: string;
  message?: string;
  description: string;
  value: string;
  threshold: string;
  status: string;
};

const FOOTER_LIMIT = 10;

const AlarmsFooter: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const raw = localStorage.getItem('alarms_footer');
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Alarm[];

      // Validate that parsed is an array
      if (!Array.isArray(parsed)) {
        console.error('Invalid alarms_footer data: expected array, got', typeof parsed);
        return [];
      }

      // Deduplicate by vehicle registration number (equipment field), keeping only the newest entry
      const vehicleMap = new Map<string, Alarm>();

      // Build map of vehicle reg no -> newest alarm entry
      for (const alarm of parsed) {
        try {
          const vehicleRegNo = String(alarm.equipment || '');
          if (!vehicleRegNo) continue; // Skip entries without vehicle reg no

          const existing = vehicleMap.get(vehicleRegNo);
          if (!existing) {
            vehicleMap.set(vehicleRegNo, alarm);
          } else {
            // Keep the entry with the newer timestamp
            const existingTime = new Date(existing.timestamp).getTime();
            const currentTime = new Date(alarm.timestamp).getTime();

            // Validate timestamps
            if (isNaN(existingTime) || isNaN(currentTime)) {
              console.warn('Invalid timestamp in alarm entry:', { existing: existing.timestamp, current: alarm.timestamp });
              // Keep the one with valid timestamp, or the existing one if both invalid
              if (!isNaN(currentTime) && isNaN(existingTime)) {
                vehicleMap.set(vehicleRegNo, alarm);
              }
            } else if (currentTime > existingTime) {
              vehicleMap.set(vehicleRegNo, alarm);
            }
          }
        } catch (error) {
          console.error('Error processing alarm entry during deduplication:', error, alarm);
        }
      }

      // Convert map back to array, sorted by timestamp (newest first)
      const deduped = Array.from(vehicleMap.values()).sort((a, b) => {
        try {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          if (isNaN(timeA) || isNaN(timeB)) return 0;
          return timeB - timeA;
        } catch {
          return 0;
        }
      });

      return deduped;
    } catch (error) {
      console.error('Failed to load footer alarms from localStorage:', error);
      return [];
    }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem('alarms_footer_collapsed');
      return raw === '1';
    } catch (error) {
      console.error('Failed to read alarms_footer_collapsed from localStorage:', error);
      return false;
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'alarms_footer') {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (!Array.isArray(parsed)) {
            console.error('Invalid alarms_footer storage event: expected array');
            setAlarms([]);
          } else {
            setAlarms(parsed);
          }
        } catch (error) {
          console.error('Failed to parse alarms_footer from storage event:', error);
          setAlarms([]);
        }
      }
      if (e.key === 'alarms_footer_collapsed') {
        setCollapsed(e.newValue === '1');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const { pathname } = useLocation();
  const isPtms = pathname.startsWith('/hmi-') || pathname.startsWith('/pump-') || pathname.startsWith('/trends') || pathname.startsWith('/alarms') || pathname.startsWith('/reports') || pathname.startsWith('/historical');

  // Clear alarms when switching between PTMS and TTMS
  useEffect(() => {
    setAlarms([]);
    try {
      localStorage.setItem('alarms_footer', JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear alarms_footer in localStorage:', error);
    }
  }, [isPtms]);

  useEffect(() => {
    try {
      localStorage.setItem('alarms_footer', JSON.stringify(alarms.slice(0, FOOTER_LIMIT)));
    } catch (error) {
      console.error('Failed to save alarms to localStorage:', error);
    }
  }, [alarms]);

  useEffect(() => {
    try {
      localStorage.setItem('alarms_footer_collapsed', collapsed ? '1' : '0');
    } catch (error) {
      console.error('Failed to save collapsed state to localStorage:', error);
    }
  }, [collapsed]);

  // expose a small listener for other parts of app to push into footer
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const custom = e as CustomEvent<Alarm>;

        // Validate event detail exists
        if (!custom?.detail) {
          console.warn('alarms-footer:add event received without detail');
          return;
        }

        // Validate required fields exist
        if (!custom.detail.timestamp) {
          console.warn('alarms-footer:add event missing required field: timestamp');
          return;
        }

        // Extract vehicle registration number from equipment field or message text
        let vehicleRegNo = String(custom.detail.equipment || '');

        // If equipment field is empty, try to extract from message
        if (!vehicleRegNo && custom.detail.message) {
          const match = custom.detail.message.match(/Vehicle\s+(\S+)/);
          if (match?.[1]) {
            vehicleRegNo = match[1];
          }
        }

        if (!vehicleRegNo) {
          console.warn('Could not extract vehicle registration number from alarm event:', custom.detail);
          return;
        }

        setAlarms((prev) => {
          try {
            // Filter out any existing entries that match this vehicle registration number
            const filtered = prev.filter((alarm) => {
              const existingRegNo = String(alarm.equipment || '');
              return existingRegNo !== vehicleRegNo;
            });

            // Add the new entry with vehicle reg no as ID at the beginning
            const newEntry: Alarm = {
              id: vehicleRegNo, // Use vehicle reg no as stable ID
              timestamp: custom.detail.timestamp,
              severity: custom.detail.severity || 'Medium',
              equipment: vehicleRegNo, // Ensure equipment field is set
              type: custom.detail.type || '',
              message: custom.detail.message,
              description: custom.detail.description || '',
              value: custom.detail.value || '',
              threshold: custom.detail.threshold || '',
              status: custom.detail.status || 'Acknowledged',
            };

            const updated = [newEntry, ...filtered];

            // If we exceed the footer limit, just slice
            // The alarms are already saved in the acknowledged list (ACKED_KEY) by AlertManager with the correct message
            // So we don't need to push them to history here (which would create duplicates)
            return updated.slice(0, FOOTER_LIMIT);
          } catch (error) {
            console.error('Error processing alarm in setAlarms:', error);
            return prev;
          }
        });
      } catch (error) {
        console.error('Error handling alarms-footer:add event:', error);
      }
    };
    window.addEventListener('alarms-footer:add', handler as EventListener);
    return () => window.removeEventListener('alarms-footer:add', handler as EventListener);
  }, []);

  // periodically generate a demo alarm and show popup every 1 minute
  useEffect(() => {
    let mounted = true;

    const generateAlarm = (): Alarm => {
      const now = new Date();

      if (isPtms) {
        // PTMS-specific alarms
        const ptmsEquipment = [`Tank-A`, `Tank-B`, `Tank-C`, `Heating-System`, `Agitator-01`, `Sensor-01`, `Valve-Main`];
        const ptmsTypes = ['Temperature High', 'Level Low', 'Pressure High', 'Motor Fault', 'Sensor Error', 'Flow Anomaly'];
        const ptmsDescriptions = [
          'Temperature exceeded critical threshold',
          'Tank level dropped below minimum',
          'System pressure above safe limit',
          'Motor operation abnormal',
          'Sensor reading inconsistent',
          'Flow rate deviation detected'
        ];

        const equipment = ptmsEquipment[Math.floor(Math.random() * ptmsEquipment.length)];
        const type = ptmsTypes[Math.floor(Math.random() * ptmsTypes.length)];
        const description = ptmsDescriptions[Math.floor(Math.random() * ptmsDescriptions.length)];

        return {
          id: Number(now.getTime()),
          timestamp: toStorageTimestamp(now),
          severity: Math.random() > 0.7 ? 'High' : 'Medium',
          equipment,
          type,
          description,
          value: (Math.random() * 100).toFixed(1),
          threshold: `${(Math.random() * 50 + 50).toFixed(1)}`,
          status: 'New',
        };
      } else {
        // TTMS-specific alarms
        return {
          id: Number(now.getTime()),
          timestamp: toStorageTimestamp(now),
          severity: Math.random() > 0.7 ? 'High' : 'Medium',
          equipment: `Pump-${Math.ceil(Math.random() * 5)}`,
          type: Math.random() > 0.5 ? 'OverTemp' : 'PressureDrop',
          description: Math.random() > 0.5 ? 'Temperature exceeded threshold' : 'Pressure dropped below threshold',
          value: (Math.random() * 100).toFixed(1),
          threshold: `${(Math.random() * 50 + 50).toFixed(1)}`,
          status: 'New',
        };
      }
    };

    // lazy import toast to avoid circular deps and only if environment supports it
    let intervalId: ReturnType<typeof setInterval> | null = null;

    intervalId = setInterval(() => {
      if (!mounted) return;
      const alarm = generateAlarm();
      // push to footer
      window.dispatchEvent(new CustomEvent('alarms-footer:add', { detail: alarm }));
      // show popup toast
      try {
        showToast({
          title: `Alarm: ${alarm.equipment}`,
          description: `${alarm.type} — ${alarm.description}`,
          variant: 'destructive',
        });
      } catch (e) {
        // ignore toast failures
      }
    }, 60_000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPtms]);

  // left offset var used by App
  return (
    <div className="fixed bottom-0 z-40 pointer-events-none" style={{ left: 'var(--content-left)', right: 0 as any }}>
      <div className={`max-w-full mx-auto px-6 py-3 bg-card/90 border-t border-border backdrop-blur-sm shadow-lg pointer-events-auto transition-all duration-300 ${collapsed ? 'h-12' : 'h-auto'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-semibold">Recent Alarms &amp; Alerts</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setCollapsed((s) => !s)}>
              {collapsed ? <><ChevronsUp className="w-4 h-4" /> Expand</> : <><ChevronsDown className="w-4 h-4" /> Collapse</>}
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            {alarms.length === 0 && (
              <div className="text-sm text-muted-foreground">No acknowledged alarms yet</div>
            )}
            {alarms.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 bg-muted/5 p-2 rounded-md border border-border">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <div className="text-xs">
                  <div className="font-medium">{a.message ?? `${a.equipment} • ${a.type}`}</div>
                  <div className="text-muted-foreground">{formatDateTimeDisplay(a.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {collapsed && (
          <div className="mt-2 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Footer collapsed — {alarms.length} acknowledged</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmsFooter;
