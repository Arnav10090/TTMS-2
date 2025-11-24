import React, { useEffect, useState } from 'react';
import { Bell, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDateTimeDisplay, toStorageTimestamp } from '@/lib/datetime';
import { useLocation } from 'react-router-dom';

type Alarm = {
  id: number;
  timestamp: string;
  severity: string;
  equipment: string;
  type: string;
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
      return JSON.parse(raw) as Alarm[];
    } catch (e) {
      return [];
    }
  });
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem('alarms_footer_collapsed');
      return raw === '1';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'alarms_footer') {
        try {
          setAlarms(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {
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
    } catch {}
  }, [isPtms]);

  useEffect(() => {
    try {
      localStorage.setItem('alarms_footer', JSON.stringify(alarms.slice(0, FOOTER_LIMIT)));
    } catch {}
  }, [alarms]);

  useEffect(() => {
    try {
      localStorage.setItem('alarms_footer_collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  // expose a small listener for other parts of app to push into footer
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Alarm>;
      if (custom?.detail) {
        setAlarms((prev) => {
          const next = [custom.detail, ...prev.filter((a) => a.id !== custom.detail.id)];
          return next.slice(0, FOOTER_LIMIT);
        });
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
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      const { toast: showToast } = require('@/hooks/use-toast');

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
    } catch (e) {
      // environment may not support dynamic require; skip periodic alarms
    }

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
            {alarms.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-muted/5 p-2 rounded-md border border-border">
                <div className={`w-2.5 h-2.5 rounded-full`} />
                <div className="text-xs">
                  <div className="font-medium">{a.equipment} • {a.type}</div>
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
