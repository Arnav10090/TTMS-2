import { TopInfoPanel } from '@/components/TopInfoPanel';
import { Download, Filter, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { formatDateTimeDisplay } from '@/lib/datetime';

const generateHistoricalData = () => {
  const data: any[] = [];
  for (let i = 0; i < 500; i++) {
    data.push({
      id: i + 1,
      timestamp: `2025-10-${String(1 + (i % 30)).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
      equipmentId: `Tank #${(i % 6) + 1}`,
      parameter: ['Temperature', 'Density', 'HCl Level', 'Flow Rate'][i % 4],
      value: (Math.random() * 100 + 50).toFixed(2),
      unit: ['°C', 'g/cm³', 'g/l', 'L/min'][i % 4],
      min: (Math.random() * 50 + 40).toFixed(2),
      max: (Math.random() * 150 + 100).toFixed(2),
      avg: (Math.random() * 100 + 70).toFixed(2),
      status: ['valid', 'valid', 'valid', 'warning', 'valid'][i % 5],
      operator: ['John D.', 'Sarah M.', 'Mike R.'][i % 3],
    });
  }
  return data;
};

const historicalData = generateHistoricalData();

const DEFAULT_FILTERS = {
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  equipment: 'all-equipment',
  parameter: 'all-params',
  shift: 'all-shifts',
  dataQuality: 'all-quality',
} as const;

const EQUIPMENT_LABELS: Record<string, string> = {
  'all-equipment': 'All Equipment',
  'tank-1': 'Tank #1',
  'tank-2': 'Tank #2',
  'tank-3': 'Tank #3',
  pumps: 'Pumps',
  sensors: 'Sensors',
};

const PARAMETER_LABELS: Record<string, string> = {
  'all-params': 'All Parameters',
  temp: 'Temperature',
  density: 'Density',
  hcl: 'HCl Level',
  flow: 'Flow Rate',
};

const SHIFT_LABELS: Record<string, string> = {
  'all-shifts': 'All Shifts',
  'shift-a': 'Shift A',
  'shift-b': 'Shift B',
  'shift-c': 'Shift C',
};

const DATA_QUALITY_LABELS: Record<string, string> = {
  'all-quality': 'All Data',
  valid: 'Valid Only',
  flagged: 'Flagged',
};

const parseDate = (s: string) => {
  const d = new Date(s.replace(' ', 'T'));
  return isNaN(d.getTime()) ? null : d;
};

const getShiftFromTimestamp = (ts: string) => {
  const d = parseDate(ts);
  if (!d) return 'shift-a';
  const h = d.getHours();
  if (h >= 6 && h < 14) return 'shift-a';
  if (h >= 14 && h < 22) return 'shift-b';
  return 'shift-c';
};

const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escape = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(',')].concat(rows.map((r) => r.map(escape).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const printSection = (html: string) => {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Print</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial;padding:20px;color:#0f1724;background:#fff}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid #eee;font-size:12px}th{background:#f7f7f7;text-align:left}</style>
  </head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
};

const HMI07Historical = () => {
  const [startDate, setStartDate] = useState<string>(DEFAULT_FILTERS.startDate);
  const [endDate, setEndDate] = useState<string>(DEFAULT_FILTERS.endDate);
  const [equipment, setEquipment] = useState<string>(DEFAULT_FILTERS.equipment);
  const [parameter, setParameter] = useState<string>(DEFAULT_FILTERS.parameter);
  const [shift, setShift] = useState<string>(DEFAULT_FILTERS.shift);
  const [dataQuality, setDataQuality] = useState<string>(DEFAULT_FILTERS.dataQuality);
  const [rowsPerPage, setRowsPerPage] = useState<number>(50);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = useMemo(() => {
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate + 'T23:59:59') : null;
    const q = searchQuery.trim().toLowerCase();

    return historicalData.filter((r) => {
      const ts = parseDate(r.timestamp);
      if (!ts) return false;
      if (s && ts < s) return false;
      if (e && ts > e) return false;
      if (equipment !== 'all-equipment' && equipment !== '') {
        if (!r.equipmentId.toLowerCase().includes(equipment.replace('tank-', 'tank #'))) return false;
      }
      if (parameter !== 'all-params' && parameter !== '') {
        const target = PARAMETER_LABELS[parameter];
        if (target && r.parameter !== target) return false;
      }
      if (shift !== 'all-shifts') {
        if (getShiftFromTimestamp(r.timestamp) !== shift) return false;
      }
      if (dataQuality !== 'all-quality') {
        if (dataQuality === 'valid' && r.status !== 'valid') return false;
        if (dataQuality === 'flagged' && r.status === 'valid') return false;
      }
      if (q) {
        const hay = `${r.equipmentId} ${r.parameter} ${r.operator} ${r.value}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [startDate, endDate, equipment, parameter, shift, dataQuality, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const end = Math.min(start + rowsPerPage, filtered.length);
  const pageRows = filtered.slice(start, end);

  useEffect(() => setPage(1), [startDate, endDate, equipment, parameter, shift, dataQuality, rowsPerPage, searchQuery]);

  const resetFilters = () => {
    setStartDate(DEFAULT_FILTERS.startDate);
    setEndDate(DEFAULT_FILTERS.endDate);
    setEquipment(DEFAULT_FILTERS.equipment);
    setParameter(DEFAULT_FILTERS.parameter);
    setShift(DEFAULT_FILTERS.shift);
    setDataQuality(DEFAULT_FILTERS.dataQuality);
    setSearchQuery('');
    setPage(1);
    toast.info('Filters reset');
  };

  const exportVisible = () => {
    const headers = ['Timestamp','Equipment','Parameter','Value','Unit','Min','Max','Avg','Status','Operator'];
    const rows = pageRows.map((r: any) => [r.timestamp,r.equipmentId,r.parameter,r.value,r.unit,r.min,r.max,r.avg,r.status,r.operator]);
    exportCSV('historical_visible.csv', headers, rows);
    toast.success('Visible data exported');
  };

  const exportFiltered = () => {
    const headers = ['Timestamp','Equipment','Parameter','Value','Unit','Min','Max','Avg','Status','Operator'];
    const rows = filtered.map((r: any) => [r.timestamp,r.equipmentId,r.parameter,r.value,r.unit,r.min,r.max,r.avg,r.status,r.operator]);
    exportCSV('historical_filtered.csv', headers, rows);
    toast.success('Filtered data exported');
  };

  const exportExcel = () => {
    // simple CSV with .xlsx extension for demo
    exportFiltered();
    toast.success('Excel exported (CSV format)');
  };

  const exportPDF = () => {
    const el = document.createElement('div');
    el.innerHTML = `<h1>Historical Data</h1><table><thead><tr>${['Timestamp','Equipment','Parameter','Value','Unit','Min','Max','Avg','Status','Operator'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${filtered.slice(0,1000).map((r:any)=>`<tr>${[r.timestamp,r.equipmentId,r.parameter,r.value,r.unit,r.min,r.max,r.avg,r.status,r.operator].map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    printSection(el.innerHTML);
    toast.success('PDF report prepared');
  };

  const appliedFilters = useMemo(() => {
    const filters: { key: string; label: string; clear: () => void }[] = [];

    if (startDate !== DEFAULT_FILTERS.startDate || endDate !== DEFAULT_FILTERS.endDate) {
      let label = '';
      if (startDate !== DEFAULT_FILTERS.startDate && endDate !== DEFAULT_FILTERS.endDate) {
        label = `Date: ${startDate} – ${endDate}`;
      } else if (startDate !== DEFAULT_FILTERS.startDate) {
        label = `Start ≥ ${startDate}`;
      } else if (endDate !== DEFAULT_FILTERS.endDate) {
        label = `End ≤ ${endDate}`;
      }
      filters.push({
        key: 'dateRange',
        label,
        clear: () => {
          setStartDate(DEFAULT_FILTERS.startDate);
          setEndDate(DEFAULT_FILTERS.endDate);
          setPage(1);
        },
      });
    }

    if (equipment !== DEFAULT_FILTERS.equipment) {
      filters.push({
        key: 'equipment',
        label: `Equipment: ${EQUIPMENT_LABELS[equipment] ?? equipment}`,
        clear: () => {
          setEquipment(DEFAULT_FILTERS.equipment);
          setPage(1);
        },
      });
    }

    if (parameter !== DEFAULT_FILTERS.parameter) {
      filters.push({
        key: 'parameter',
        label: `Parameter: ${PARAMETER_LABELS[parameter] ?? parameter}`,
        clear: () => {
          setParameter(DEFAULT_FILTERS.parameter);
          setPage(1);
        },
      });
    }

    if (shift !== DEFAULT_FILTERS.shift) {
      filters.push({
        key: 'shift',
        label: `Shift: ${SHIFT_LABELS[shift] ?? shift}`,
        clear: () => {
          setShift(DEFAULT_FILTERS.shift);
          setPage(1);
        },
      });
    }

    if (dataQuality !== DEFAULT_FILTERS.dataQuality) {
      filters.push({
        key: 'dataQuality',
        label: `Quality: ${DATA_QUALITY_LABELS[dataQuality] ?? dataQuality}`,
        clear: () => {
          setDataQuality(DEFAULT_FILTERS.dataQuality);
          setPage(1);
        },
      });
    }

    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      filters.push({
        key: 'search',
        label: `Search: "${trimmed}"`,
        clear: () => {
          setSearchQuery('');
          setPage(1);
        },
      });
    }

    return filters;
  }, [startDate, endDate, equipment, parameter, shift, dataQuality, searchQuery]);

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
            <Button key={n} variant="outline" size="sm" className={currentPage === n ? 'bg-primary text-primary-foreground' : ''} onClick={() => setPage(n)}>
              {n}
            </Button>
          ),
    );
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      <div className="hmi-card">
        {/* Advanced Filter Panel */}
        <div className="glass-panel p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Advanced Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="date" className="pl-10 bg-card border-border" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="date" className="pl-10 bg-card border-border" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Equipment</label>
              <Select value={equipment} onValueChange={(v)=>setEquipment(v)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all-equipment">All Equipment</SelectItem>
                  <SelectItem value="tank-1">Tank #1</SelectItem>
                  <SelectItem value="tank-2">Tank #2</SelectItem>
                  <SelectItem value="tank-3">Tank #3</SelectItem>
                  <SelectItem value="pumps">Pumps</SelectItem>
                  <SelectItem value="sensors">Sensors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Parameter</label>
              <Select value={parameter} onValueChange={(v)=>setParameter(v)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all-params">All Parameters</SelectItem>
                  <SelectItem value="temp">Temperature</SelectItem>
                  <SelectItem value="density">Density</SelectItem>
                  <SelectItem value="hcl">HCl Level</SelectItem>
                  <SelectItem value="flow">Flow Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Shift Filter</label>
              <Select value={shift} onValueChange={(v)=>setShift(v)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all-shifts">All Shifts</SelectItem>
                  <SelectItem value="shift-a">Shift A</SelectItem>
                  <SelectItem value="shift-b">Shift B</SelectItem>
                  <SelectItem value="shift-c">Shift C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data Quality</label>
              <Select value={dataQuality} onValueChange={(v)=>setDataQuality(v)}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="all-quality">All Data</SelectItem>
                  <SelectItem value="valid">Valid Only</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:col-span-2 lg:col-span-4">
              <span className="inline-flex h-8 items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Export Options:</span>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportVisible}>
                <Download className="w-3 h-3" />
                Visible Data (CSV)
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportFiltered}>
                <Download className="w-3 h-3" />
                All Filtered (CSV)
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportExcel}>
                <Download className="w-3 h-3" />
                Excel (XLSX)
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={exportPDF}>
                <Download className="w-3 h-3" />
                PDF Report
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={()=>{setStartDate('2025-10-13');setEndDate('2025-10-13');}}>Today</Button>
            <Button variant="ghost" size="sm" onClick={()=>{ /* implement as needed */ }}>Yesterday</Button>
            <Button variant="ghost" size="sm" onClick={()=>{setStartDate('2025-10-07');setEndDate('2025-10-13');}}>Last 7 Days</Button>
            <Button variant="ghost" size="sm" onClick={()=>{setStartDate('2025-09-14');setEndDate('2025-10-13');}}>Last 30 Days</Button>
            <Button variant="ghost" size="sm">This Month</Button>
            <Button variant="ghost" size="sm">Last Month</Button>
          </div>

          {appliedFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wide text-muted-foreground">Active Filters:</span>
              {appliedFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-2 rounded-full bg-muted/20 px-3 py-1 text-muted-foreground"
                >
                  <span className="text-xs font-medium text-foreground">{filter.label}</span>
                  <button
                    type="button"
                    onClick={filter.clear}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                    aria-label={`Remove ${filter.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={resetFilters}>
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Input placeholder="Search historical..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="w-64" />
            </div>
            <div className="text-sm text-muted-foreground">Showing {start + 1}-{end} of {filtered.length} records</div>
          </div>
          <table className="w-full border border-border/40">
            <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
              <tr className="bg-card/95">
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Timestamp</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Equipment ID</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Parameter</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Value</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Unit</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Min</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Max</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Avg</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Status</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground border border-border/40">Operator</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((record:any) => (
                <tr
                  key={record.id}
                  className="border-b border-border/30 hover:bg-muted/10 transition-colors"
                >
                  <td className="py-2 px-4 text-xs font-mono border border-border/30">{formatDateTimeDisplay(record.timestamp)}</td>
                  <td className="py-2 px-4 text-xs font-medium border border-border/30">{record.equipmentId}</td>
                  <td className="py-2 px-4 text-xs border border-border/30">{record.parameter}</td>
                  <td className={`py-2 px-4 text-xs font-mono font-semibold border border-border/30 ${
                    record.status === 'warning' ? 'text-warning' : 'text-success'
                  }`}>
                    {record.value}
                  </td>
                  <td className="py-2 px-4 text-xs font-mono text-muted-foreground border border-border/30">{record.unit}</td>
                  <td className="py-2 px-4 text-xs font-mono border border-border/30">{record.min}</td>
                  <td className="py-2 px-4 text-xs font-mono border border-border/30">{record.max}</td>
                  <td className="py-2 px-4 text-xs font-mono border border-border/30">{record.avg}</td>
                  <td className="py-2 px-4 border border-border/30">
                    {record.status === 'valid' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                        Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-warning">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                        Warning
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-xs border border-border/30">{record.operator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Advanced Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {start + 1}-{end} of {filtered.length} records
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Rows per page:</label>
              <Select value={String(rowsPerPage)} onValueChange={(v)=>setRowsPerPage(Number(v))}>
                <SelectTrigger className="w-20 h-8 bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={()=>setPage(1)}>First</Button>
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={()=>setPage((p)=>Math.max(1,p-1))}>Previous</Button>
            <div className="flex items-center gap-1">
              {renderPageButtons()}
            </div>
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={()=>setPage((p)=>Math.min(pageCount,p+1))}>Next</Button>
            <Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={()=>setPage(pageCount)}>Last</Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HMI07Historical;
