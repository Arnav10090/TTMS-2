import { TopInfoPanel } from '@/components/TopInfoPanel';
import { Bell, Search, Download, CheckCircle, AlertTriangle, AlertCircle, Info, ChevronsDown, ChevronsUp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { formatDateTimeDisplay } from '@/lib/datetime';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'active' | 'acknowledged' | 'cleared';

type Alarm = {
  id: number;
  timestamp: string; // human friendly
  severity: Severity;
  equipment: string;
  type: string;
  description: string;
  value: string;
  threshold: string;
  status: Status;
};

const initialAlarms: Alarm[] = [
  { id: 1, timestamp: '2025-10-13 14:32:15', severity: 'critical', equipment: 'Tank #2', type: 'HCl Concentration', description: 'High HCl concentration detected', value: '165 g/l', threshold: '150 g/l', status: 'active' },
  { id: 2, timestamp: '2025-10-13 14:15:42', severity: 'high', equipment: 'Storage Tank #1', type: 'Level Warning', description: 'Low level warning', value: '15%', threshold: '20%', status: 'acknowledged' },
  { id: 3, timestamp: '2025-10-13 13:58:30', severity: 'critical', equipment: 'Pump #1', type: 'Equipment Failure', description: 'Pump failure detected - No flow', value: '0 L/min', threshold: '> 50 L/min', status: 'active' },
  { id: 4, timestamp: '2025-10-13 13:45:18', severity: 'medium', equipment: 'Hot Rinse Tank', type: 'Temperature', description: 'Temperature threshold exceeded', value: '72°C', threshold: '70°C', status: 'acknowledged' },
  { id: 5, timestamp: '2025-10-13 13:22:05', severity: 'high', equipment: 'Sensor #12', type: 'Communication', description: 'Communication loss with sensor', value: 'No Signal', threshold: 'Connected', status: 'cleared' },
  { id: 6, timestamp: '2025-10-13 12:55:11', severity: 'low', equipment: 'Pump #2', type: 'Vibration', description: 'Slight vibration increase', value: '1.2 g', threshold: '1.5 g', status: 'cleared' },
  { id: 7, timestamp: '2025-10-13 12:40:02', severity: 'medium', equipment: 'Tank #1', type: 'pH', description: 'pH above nominal', value: '2.6', threshold: '2.2', status: 'acknowledged' },
  { id: 8, timestamp: '2025-10-13 12:10:44', severity: 'high', equipment: 'Vent Scrubber', type: 'Pressure', description: 'High pressure detected', value: '1.9 bar', threshold: '1.5 bar', status: 'active' },
  { id: 9, timestamp: '2025-10-13 11:55:27', severity: 'critical', equipment: 'Pump #3', type: 'Overcurrent', description: 'Motor overcurrent', value: '42 A', threshold: '35 A', status: 'active' },
  { id: 10, timestamp: '2025-10-13 11:40:10', severity: 'low', equipment: 'Storage Tank #2', type: 'Level', description: 'Level trending low', value: '30%', threshold: '25%', status: 'cleared' },
  { id: 11, timestamp: '2025-10-13 11:15:33', severity: 'medium', equipment: 'Heat Exchanger', type: 'Temperature', description: 'Outlet temp rise', value: '68°C', threshold: '65°C', status: 'acknowledged' },
  { id: 12, timestamp: '2025-10-13 10:55:19', severity: 'high', equipment: 'Tank #3', type: 'HCl Concentration', description: 'Concentration near limit', value: '148 g/l', threshold: '150 g/l', status: 'acknowledged' },
  { id: 13, timestamp: '2025-10-13 10:35:42', severity: 'low', equipment: 'Sensor #5', type: 'Calibration', description: 'Calibration due soon', value: 'N/A', threshold: 'Scheduled', status: 'cleared' },
  { id: 14, timestamp: '2025-10-13 10:05:08', severity: 'medium', equipment: 'Pump #1', type: 'Vibration', description: 'Vibration trend rising', value: '1.4 g', threshold: '1.5 g', status: 'active' },
  { id: 15, timestamp: '2025-10-13 09:45:59', severity: 'high', equipment: 'Hot Rinse Tank', type: 'Temperature', description: 'Temperature high warning', value: '71°C', threshold: '70°C', status: 'acknowledged' },
  { id: 16, timestamp: '2025-10-13 09:20:21', severity: 'low', equipment: 'Storage Tank #1', type: 'Level', description: 'Level oscillations detected', value: '45%', threshold: '—', status: 'cleared' },
  { id: 17, timestamp: '2025-10-13 08:58:15', severity: 'critical', equipment: 'Pump #2', type: 'Equipment Failure', description: 'Seal failure suspected', value: 'Leak rate high', threshold: 'No leaks', status: 'active' },
  { id: 18, timestamp: '2025-10-13 08:30:05', severity: 'medium', equipment: 'Tank #2', type: 'pH', description: 'pH below nominal', value: '1.8', threshold: '2.0', status: 'acknowledged' },
  { id: 19, timestamp: '2025-10-13 08:05:47', severity: 'high', equipment: 'Vent Scrubber', type: 'Pressure', description: 'Pressure spike recorded', value: '2.1 bar', threshold: '1.5 bar', status: 'cleared' },
  { id: 20, timestamp: '2025-10-13 07:50:23', severity: 'low', equipment: 'Sensor #9', type: 'Battery', description: 'Battery low', value: '18%', threshold: '15%', status: 'active' },
  { id: 21, timestamp: '2025-10-14 00:12:42', severity: 'medium', equipment: 'Tank #4', type: 'Level', description: 'Level high warning', value: '87%', threshold: '85%', status: 'acknowledged' },
  { id: 22, timestamp: '2025-10-14 01:05:16', severity: 'high', equipment: 'Pump #4', type: 'Overcurrent', description: 'Current draw elevated', value: '38 A', threshold: '35 A', status: 'active' },
  { id: 23, timestamp: '2025-10-14 02:22:09', severity: 'low', equipment: 'Sensor #3', type: 'Signal', description: 'Intermittent signal', value: 'Drops observed', threshold: 'Stable', status: 'cleared' },
  { id: 24, timestamp: '2025-10-14 03:40:31', severity: 'medium', equipment: 'Heat Exchanger', type: 'Temperature', description: 'Inlet temp high', value: '75°C', threshold: '72°C', status: 'active' },
  { id: 25, timestamp: '2025-10-14 04:10:55', severity: 'critical', equipment: 'Tank #5', type: 'HCl Concentration', description: 'Critical concentration', value: '170 g/l', threshold: '150 g/l', status: 'active' },
  { id: 26, timestamp: '2025-10-14 04:45:12', severity: 'high', equipment: 'Sensor #15', type: 'Communication', description: 'Intermittent comms detected', value: 'No Signal', threshold: 'Connected', status: 'active' },
  { id: 27, timestamp: '2025-10-14 05:05:33', severity: 'low', equipment: 'Pump #5', type: 'Vibration', description: 'Minor vibration', value: '0.9 g', threshold: '1.5 g', status: 'cleared' },
  { id: 28, timestamp: '2025-10-14 05:30:10', severity: 'medium', equipment: 'Tank #6', type: 'Temperature', description: 'Temperature rising', value: '69°C', threshold: '70°C', status: 'active' },
  { id: 29, timestamp: '2025-10-14 06:12:01', severity: 'high', equipment: 'Vent Scrubber', type: 'Pressure', description: 'Pressure sustained high', value: '1.8 bar', threshold: '1.5 bar', status: 'acknowledged' },
  { id: 30, timestamp: '2025-10-14 06:45:45', severity: 'critical', equipment: 'Pump #6', type: 'Overcurrent', description: 'Drive overcurrent', value: '48 A', threshold: '35 A', status: 'active' },
  { id: 31, timestamp: '2025-10-14 07:05:22', severity: 'medium', equipment: 'Sensor #7', type: 'Calibration', description: 'Calibration overdue', value: 'N/A', threshold: 'Scheduled', status: 'acknowledged' },
  { id: 32, timestamp: '2025-10-14 07:30:00', severity: 'low', equipment: 'Storage Tank #3', type: 'Level', description: 'Level nominal', value: '55%', threshold: '—', status: 'cleared' },
  { id: 33, timestamp: '2025-10-14 08:01:11', severity: 'high', equipment: 'Pump #7', type: 'Equipment Failure', description: 'Pump stall detected', value: '0 L/min', threshold: '> 50 L/min', status: 'active' },
  { id: 34, timestamp: '2025-10-14 08:25:47', severity: 'medium', equipment: 'Heat Exchanger', type: 'Temperature', description: 'Outlet temp fluctuating', value: '70°C', threshold: '68°C', status: 'acknowledged' },
  { id: 35, timestamp: '2025-10-14 08:50:30', severity: 'low', equipment: 'Sensor #20', type: 'Battery', description: 'Battery replacement due', value: '20%', threshold: '15%', status: 'cleared' },
  { id: 36, timestamp: '2025-10-14 09:15:15', severity: 'critical', equipment: 'Tank #7', type: 'HCl Concentration', description: 'Critical concentration spike', value: '175 g/l', threshold: '150 g/l', status: 'active' },
  { id: 37, timestamp: '2025-10-14 09:40:59', severity: 'high', equipment: 'Pump #8', type: 'Overcurrent', description: 'Current above threshold', value: '40 A', threshold: '35 A', status: 'active' },
  { id: 38, timestamp: '2025-10-14 10:05:03', severity: 'medium', equipment: 'Tank #8', type: 'pH', description: 'pH trending down', value: '1.9', threshold: '2.0', status: 'acknowledged' },
  { id: 39, timestamp: '2025-10-14 10:30:27', severity: 'low', equipment: 'Pump #9', type: 'Vibration', description: 'Vibration normalizing', value: '1.0 g', threshold: '1.5 g', status: 'cleared' },
  { id: 40, timestamp: '2025-10-14 10:55:55', severity: 'high', equipment: 'Vent Scrubber', type: 'Pressure', description: 'Intermittent pressure spike', value: '2.0 bar', threshold: '1.5 bar', status: 'active' },
  { id: 41, timestamp: '2025-10-14 11:20:12', severity: 'critical', equipment: 'Pump #10', type: 'Equipment Failure', description: 'Severe pump fault', value: '0 L/min', threshold: '> 50 L/min', status: 'active' },
  { id: 42, timestamp: '2025-10-14 11:45:00', severity: 'medium', equipment: 'Tank #9', type: 'Temperature', description: 'Temperature above nominal', value: '73°C', threshold: '70°C', status: 'acknowledged' },
  { id: 43, timestamp: '2025-10-14 12:10:33', severity: 'low', equipment: 'Sensor #21', type: 'Signal', description: 'Signal intermittent', value: 'Drops observed', threshold: 'Stable', status: 'cleared' },
  { id: 44, timestamp: '2025-10-14 12:35:19', severity: 'high', equipment: 'Pump #11', type: 'Vibration', description: 'High vibration', value: '2.0 g', threshold: '1.5 g', status: 'active' },
  { id: 45, timestamp: '2025-10-14 13:00:42', severity: 'medium', equipment: 'Heat Exchanger', type: 'Temperature', description: 'Bypass open', value: '68°C', threshold: '—', status: 'acknowledged' },
  { id: 46, timestamp: '2025-10-14 13:25:55', severity: 'low', equipment: 'Sensor #22', type: 'Calibration', description: 'Calibration scheduled', value: 'N/A', threshold: 'Scheduled', status: 'cleared' },
  { id: 47, timestamp: '2025-10-14 13:50:30', severity: 'critical', equipment: 'Tank #10', type: 'HCl Concentration', description: 'Concentration critical', value: '180 g/l', threshold: '150 g/l', status: 'active' },
  { id: 48, timestamp: '2025-10-14 14:15:05', severity: 'high', equipment: 'Pump #12', type: 'Overcurrent', description: 'Current fluctuating', value: '39 A', threshold: '35 A', status: 'active' },
  { id: 49, timestamp: '2025-10-14 14:40:11', severity: 'medium', equipment: 'Tank #11', type: 'Level', description: 'Level high warning', value: '90%', threshold: '85%', status: 'acknowledged' },
  { id: 50, timestamp: '2025-10-14 15:05:59', severity: 'low', equipment: 'Sensor #23', type: 'Battery', description: 'Battery low', value: '17%', threshold: '15%', status: 'cleared' },
  { id: 51, timestamp: '2025-10-14 15:33:21', severity: 'high', equipment: 'Pump #13', type: 'Equipment Failure', description: 'Pump overheating', value: 'Temp high', threshold: 'Normal', status: 'active' },
  { id: 52, timestamp: '2025-10-14 16:00:00', severity: 'medium', equipment: 'Tank #12', type: 'pH', description: 'pH slightly high', value: '2.3', threshold: '2.0', status: 'acknowledged' },
  { id: 53, timestamp: '2025-10-14 16:25:42', severity: 'low', equipment: 'Sensor #24', type: 'Signal', description: 'Signal restored', value: 'Stable', threshold: 'Stable', status: 'cleared' },
  { id: 54, timestamp: '2025-10-14 16:52:10', severity: 'critical', equipment: 'Pump #14', type: 'Overcurrent', description: 'Severe overcurrent', value: '55 A', threshold: '35 A', status: 'active' },
  { id: 55, timestamp: '2025-10-14 17:15:00', severity: 'high', equipment: 'Vent Scrubber', type: 'Pressure', description: 'Pressure anomaly', value: '2.2 bar', threshold: '1.5 bar', status: 'active' },
  { id: 56, timestamp: '2025-10-14 17:40:33', severity: 'medium', equipment: 'Heat Exchanger', type: 'Temperature', description: 'Temperature hold', value: '71°C', threshold: '70°C', status: 'acknowledged' },
  { id: 57, timestamp: '2025-10-14 18:05:55', severity: 'low', equipment: 'Sensor #25', type: 'Calibration', description: 'Calibration completed', value: 'N/A', threshold: 'Scheduled', status: 'cleared' },
  { id: 58, timestamp: '2025-10-14 18:30:22', severity: 'critical', equipment: 'Tank #13', type: 'HCl Concentration', description: 'Concentration critical', value: '172 g/l', threshold: '150 g/l', status: 'active' },
  { id: 59, timestamp: '2025-10-14 19:00:00', severity: 'high', equipment: 'Pump #15', type: 'Overcurrent', description: 'High current', value: '41 A', threshold: '35 A', status: 'active' },
  { id: 60, timestamp: '2025-10-14 19:25:10', severity: 'medium', equipment: 'Tank #14', type: 'Level', description: 'Level fluctuation', value: '62%', threshold: '—', status: 'acknowledged' },
];

const severityConfig = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/20', border: 'border-destructive/30', icon: AlertCircle },
  high: { color: 'text-warning', bg: 'bg-warning/20', border: 'border-warning/30', icon: AlertTriangle },
  medium: { color: 'text-accent', bg: 'bg-accent/20', border: 'border-accent/30', icon: AlertTriangle },
  low: { color: 'text-info', bg: 'bg-info/20', border: 'border-info/30', icon: Info },
} as const;

const statusConfig = {
  active: { color: 'text-destructive', bg: 'bg-destructive/20', label: 'Active', pulse: true },
  acknowledged: { color: 'text-warning', bg: 'bg-warning/20', label: 'Acknowledged', pulse: false },
  cleared: { color: 'text-success', bg: 'bg-success/20', label: 'Cleared', pulse: false },
} as const;

const FOOTER_LIMIT = 10;

const HMI05Alarms = () => {
  const [data, setData] = useState<Alarm[]>(initialAlarms);
  const [severity, setSeverity] = useState<'all-severity' | Severity>('all-severity');
  const [status, setStatus] = useState<'all-status' | Status>('all-status');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'custom'>('custom');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [footerIds, setFooterIds] = useState<number[]>(() =>
    // initialize footer with most recent acknowledged alarms (by id desc)
    initialAlarms.filter((a) => a.status === 'acknowledged').slice(-FOOTER_LIMIT).map((a) => a.id).reverse(),
  );

  // popup tracks ids of generated alarms that should appear in the popup and remain until acknowledged
  const [popupAlarmIds, setPopupAlarmIds] = useState<number[]>([]);
  const [footerCollapsed, setFooterCollapsed] = useState(false);

  const pageSize = 10;

  const activeCount = useMemo(() => data.filter((a) => a.status === 'active').length, [data]);

  // filtered includes all alarms but we will exclude footer IDs from the table view
  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = ((): Date | null => {
      if (timeRange === '1h') return new Date(now.getTime() - 1 * 60 * 60 * 1000);
      if (timeRange === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (timeRange === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return null; // custom -> no time filter for now
    })();

    const q = query.trim().toLowerCase();

    const arr = data.filter((a) => {
      if (footerIds.includes(a.id)) return false; // footer items not shown in the table
      if (severity !== 'all-severity' && a.severity !== severity) return false;
      if (status !== 'all-status' && a.status !== status) return false;
      if (cutoff) {
        const ts = new Date(a.timestamp.replace(' ', 'T'));
        if (!(ts instanceof Date) || isNaN(ts.getTime())) return false;
        if (ts < cutoff) return false;
      }
      if (q) {
        const hay = `${a.equipment} ${a.type} ${a.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // sort newest first by timestamp
    arr.sort((a, b) => {
      const ta = new Date(a.timestamp.replace(' ', 'T')).getTime();
      const tb = new Date(b.timestamp.replace(' ', 'T')).getTime();
      return tb - ta;
    });

    return arr;
  }, [data, severity, status, timeRange, query, footerIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, filtered.length);
  const pageRows = filtered.slice(start, end);

  const resetToFirstPage = () => setPage(1);

  const handleExport = () => {
    const rows = filtered;
    const headers = ['timestamp', 'severity', 'equipment', 'type', 'description', 'value', 'threshold', 'status'] as const;
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [headers.join(',')]
      .concat(
        rows.map((r) =>
          [r.timestamp, r.severity, r.equipment, r.type, r.description, r.value, r.threshold, r.status]
            .map(escape)
            .join(','),
        ),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alarms.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // acknowledge: update alarm status, add to footer (most recent at front), and remove from popup list
  const acknowledge = (id: number) => {
    const ackAlarm = data.find((a) => a.id === id);

    setData((prev) => prev.map((a) => (a.id === id && a.status === 'active' ? { ...a, status: 'acknowledged' } : a)));

    setFooterIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)];
      // if more than FOOTER_LIMIT, drop the last entries (those go back into the table)
      return next.slice(0, FOOTER_LIMIT);
    });

    setPopupAlarmIds((prev) => prev.filter((x) => x !== id));

    // notify global footer in same window
    try {
      if (ackAlarm) {
        const detail = { ...ackAlarm, status: 'acknowledged' };
        window.dispatchEvent(new CustomEvent('alarms-footer:add', { detail }));
      }
    } catch (e) {}

    toast.info('Alarm acknowledged');
  };

  const info = (a: Alarm) => {
    toast(a.description, { description: `${a.equipment} • ${a.type} • ${a.value} (threshold ${a.threshold})` });
  };

  const closeAlarm = (id: number) => {
    // Permanently remove alarm from data and any lists
    setData((prev) => prev.filter((a) => a.id !== id));
    setPopupAlarmIds((prev) => prev.filter((x) => x !== id));
    setFooterIds((prev) => prev.filter((x) => x !== id));
    toast.success('Alarm closed');
  };

  const renderPageButtons = () => {
    const items: number[] = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) items.push(i);
    } else {
      items.push(1, 2, 3);
      if (currentPage > 4 && currentPage < pageCount - 2) {
        items.push(currentPage - 1, currentPage, currentPage + 1);
      }
      items.push(pageCount - 2, pageCount - 1, pageCount);
    }
    const unique = Array.from(new Set(items.filter((n) => n >= 1 && n <= pageCount))).sort((a, b) => a - b);

    const withEllipsis: (number | '...')[] = [];
    unique.forEach((n, i) => {
      if (i === 0) withEllipsis.push(n);
      else {
        const prev = unique[i - 1];
        if (n - prev > 1) withEllipsis.push('...');
        withEllipsis.push(n);
      }
    });

    return withEllipsis.map((n, idx) =>
      n === '...'
        ? (
            <span key={`e-${idx}`} className="px-2 select-none">
              ...
            </span>
          )
        : (
            <Button
              key={n}
              variant="outline"
              size="sm"
              className={currentPage === n ? 'bg-primary text-primary-foreground' : ''}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ),
    );
  };

  // generate a synthetic alarm
  const generateAlarm = (override?: Partial<Alarm>) => {
    setData((prev) => {
      const maxId = prev.reduce((m, a) => Math.max(m, a.id), 0);
      const id = maxId + 1;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
      const severity = (override?.severity || severities[Math.floor(Math.random() * severities.length)]) as Severity;
      const equipment = override?.equipment || `Sensor #${Math.ceil(Math.random() * 20)}`;
      const type = override?.type || (severity === 'critical' ? 'Equipment Failure' : 'Alert');
      const description = override?.description || `${type} detected on ${equipment}`;
      const value = override?.value || (severity === 'low' ? 'N/A' : `${Math.ceil(Math.random() * 100)} units`);
      const threshold = override?.threshold || '—';

      const alarm: Alarm = {
        id,
        timestamp: ts,
        severity,
        equipment,
        type,
        description,
        value,
        threshold,
        status: 'active',
        ...override,
      };

      // add to popup list so the popup appears until acknowledged
      setPopupAlarmIds((p) => [...p, id]);

      return [alarm, ...prev];
    });
  };

  // every 1 minute generate a new alarm
  useEffect(() => {
    const id = setInterval(() => {
      generateAlarm();
    }, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // popup is visible if any popupAlarmIds still refer to active alarms
  const popupActiveAlarms = useMemo(() => {
    return popupAlarmIds
      .map((id) => data.find((a) => a.id === id))
      .filter((a): a is Alarm => !!a && a.status === 'active');
  }, [popupAlarmIds, data]);

  // applied filters for UI chips
  const appliedFilters = useMemo(() => {
    const filters: { key: string; label: string; clear: () => void }[] = [];
    if (severity !== 'all-severity') {
      filters.push({ key: 'severity', label: `Severity: ${severity}`, clear: () => { setSeverity('all-severity'); resetToFirstPage(); } });
    }
    if (status !== 'all-status') {
      filters.push({ key: 'status', label: `Status: ${status}`, clear: () => { setStatus('all-status'); resetToFirstPage(); } });
    }
    if (timeRange !== 'custom') {
      const labelMap: Record<string,string> = { '1h': 'Last Hour', '24h': 'Last 24 Hours', '7d': 'Last 7 Days', 'custom': 'All Time' };
      filters.push({ key: 'timeRange', label: `Time: ${labelMap[timeRange] ?? timeRange}`, clear: () => { setTimeRange('custom'); resetToFirstPage(); } });
    }
    if (query.trim()) {
      filters.push({ key: 'query', label: `Search: "${query.trim()}"`, clear: () => { setQuery(''); resetToFirstPage(); } });
    }
    return filters;
  }, [severity, status, timeRange, query]);

  // footer alarms details
  const footerAlarms = footerIds.map((id) => data.find((a) => a.id === id)).filter((a): a is Alarm => !!a);

  // persist footer alarms to localStorage so global footer can read them
  useEffect(() => {
    try {
      localStorage.setItem('alarms_footer', JSON.stringify(footerAlarms.slice(0, FOOTER_LIMIT)));
    } catch (e) {
      // ignore
    }
  }, [footerAlarms]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      <div className="flex items-center justify-center">
        <div className="px-4 py-2 rounded-lg bg-destructive/20 border border-destructive/30">
          <span className="text-sm font-semibold text-destructive">{activeCount} Active Alarms</span>
        </div>
      </div>

      <div className="hmi-card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Select value={severity} onValueChange={(v) => { setSeverity(v as any); resetToFirstPage(); }}>
            <SelectTrigger className="bg-card border-border hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 shadow-lg">
              <SelectItem value="all-severity" className="hover:bg-primary/10 cursor-pointer">All Severity</SelectItem>
              <SelectItem value="critical" className="hover:bg-primary/10 cursor-pointer">Critical</SelectItem>
              <SelectItem value="high" className="hover:bg-primary/10 cursor-pointer">High</SelectItem>
              <SelectItem value="medium" className="hover:bg-primary/10 cursor-pointer">Medium</SelectItem>
              <SelectItem value="low" className="hover:bg-primary/10 cursor-pointer">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => { setStatus(v as any); resetToFirstPage(); }}>
            <SelectTrigger className="bg-card border-border hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 shadow-lg">
              <SelectItem value="all-status" className="hover:bg-primary/10 cursor-pointer">All Status</SelectItem>
              <SelectItem value="active" className="hover:bg-primary/10 cursor-pointer">Active</SelectItem>
              <SelectItem value="acknowledged" className="hover:bg-primary/10 cursor-pointer">Acknowledged</SelectItem>
              <SelectItem value="cleared" className="hover:bg-primary/10 cursor-pointer">Cleared</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(v) => { setTimeRange(v as any); resetToFirstPage(); }}>
            <SelectTrigger className="bg-card border-border hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50 shadow-lg">
              <SelectItem value="1h" className="hover:bg-primary/10 cursor-pointer">Last Hour</SelectItem>
              <SelectItem value="24h" className="hover:bg-primary/10 cursor-pointer">Last 24 Hours</SelectItem>
              <SelectItem value="7d" className="hover:bg-primary/10 cursor-pointer">Last 7 Days</SelectItem>
              <SelectItem value="custom" className="hover:bg-primary/10 cursor-pointer">All Time</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); resetToFirstPage(); }}
              placeholder="Search alarms..."
              className="pl-10 bg-card border-border"
            />
          </div>

          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {appliedFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-muted-foreground">Active Filters:</span>
            {appliedFilters.map((f) => (
              <span key={f.key} className="inline-flex items-center gap-2 rounded-full bg-muted/20 px-3 py-1 text-muted-foreground">
                <span className="text-xs font-medium text-foreground">{f.label}</span>
                <button type="button" onClick={f.clear} className="rounded-full p-1 hover:bg-muted/40">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setSeverity('all-severity'); setStatus('all-status'); setTimeRange('custom'); setQuery(''); resetToFirstPage(); }}>
              Clear all
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Timestamp</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Severity</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Equipment</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Value</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Threshold</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((alarm) => {
                const sev = severityConfig[alarm.severity];
                const st = statusConfig[alarm.status];
                const SeverityIcon = sev.icon;

                return (
                  <tr
                    key={alarm.id}
                    className={`border-b border-border/30 hover:bg-primary/8 hover:shadow-sm transition-all duration-150 cursor-pointer ${alarm.status === 'active' ? 'border-l-4 border-l-destructive' : ''}`}
                  >
                    <td className="py-3 px-4 text-sm font-mono">{formatDateTimeDisplay(alarm.timestamp)}</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${sev.bg} ${sev.border} border`}>
                        <SeverityIcon className={`w-4 h-4 ${sev.color}`} />
                        <span className={`text-xs font-semibold uppercase ${sev.color}`}>{alarm.severity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">{alarm.equipment}</td>
                    <td className="py-3 px-4 text-sm">{alarm.type}</td>
                    <td className="py-3 px-4 text-sm">{alarm.description}</td>
                    <td className="py-3 px-4 text-sm font-mono font-semibold">{alarm.value}</td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{alarm.threshold}</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${st.bg}`}>
                        {st.pulse && <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>}
                        <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => closeAlarm(alarm.id)}>
                          Close
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => info(alarm)}>
                          <Info className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td className="py-8 px-4 text-center text-sm text-muted-foreground" colSpan={9}>
                    No alarms match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <div className="text-sm text-muted-foreground">
            {filtered.length === 0 ? 'Showing 0 of 0 alarms' : `Showing ${start + 1}-${end} of ${filtered.length} alarms`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(1)}>
              First
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              « Prev
            </Button>
            {renderPageButtons()}
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
              Next »
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}>
              Last
            </Button>
          </div>
        </div>
      </div>


      {/* Popup for new alarms - centered modal with blurred backdrop */}
      {popupActiveAlarms.length > 0 && (
        <div className="fixed inset-0 z-60 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="new-alarms-title">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden />

          <div className="relative w-11/12 max-w-2xl z-70">
            <div className="bg-card border border-border shadow-xl rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-destructive" />
                  <div>
                    <div id="new-alarms-title" className="text-lg font-semibold">New Alarms</div>
                    <div className="text-xs text-muted-foreground">These will remain until acknowledged</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{popupActiveAlarms.length} unacknowledged</div>
              </div>

              <div className="max-h-80 overflow-auto">
                {popupActiveAlarms.map((a) => {
                  const sev = severityConfig[a.severity];
                  const SeverityIcon = sev.icon;
                  return (
                    <div key={a.id} className="px-6 py-4 hover:bg-muted/10 flex items-start gap-4 border-b border-border">
                      <div className="flex-shrink-0">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${sev.bg} ${sev.border} border`}>
                          <SeverityIcon className={`w-4 h-4 ${sev.color}`} />
                          <span className={`text-xs font-semibold uppercase ${sev.color}`}>{a.severity}</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="text-sm font-medium">{a.equipment} — {a.type}</div>
                        <div className="text-xs text-muted-foreground">{a.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{a.timestamp} • {a.value}</div>
                      </div>

                      <div className="ml-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => acknowledge(a.id)}>
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="primary" onClick={() => {
                    // acknowledge all visible popup alarms
                    popupActiveAlarms.forEach((a) => acknowledge(a.id));
                  }}>
                    Acknowledge All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HMI05Alarms;
