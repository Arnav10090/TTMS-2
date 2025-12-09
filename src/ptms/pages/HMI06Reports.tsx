import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { TopInfoPanel } from '@/components/TopInfoPanel';

type CoilRow = {
  sn: number;
  coilId: string;
  grade: string;
  width: number;
  weight: number;
  thick: number;
  lineSpeed: number;
  startTime: string;
  endTime: string;
  totalTime: string;
  output: number;
  prodRate: number;
  picklingLine: string;
  kwhTon: number;
  yieldPct: number;
  quality: string;
  t1Temp: string; t1Cond: string; t1Dens: string; t1Conc: string; t1pH: string;
  t2Temp: string; t2Cond: string; t2Dens: string; t2Conc: string; t2pH: string;
  t3Temp: string; t3Cond: string; t3Dens: string; t3Conc: string; t3pH: string;
  rinseTemp: string; rinseCond: string; rinsePH: string;
};

type DailyRow = {
  sn: number;
  date: string;
  coils: number;
  inWt: number;
  outWt: number;
  yieldPct: number;
  tank1AvgTemp: string;
  tank1AvgConc: string;
  tank2AvgTemp: string;
  tank2AvgConc: string;
  tank3AvgTemp: string;
  tank3AvgConc: string;
  rinseTemp: string;
  rinsePH: string;
  faConsLtrs: number;
  faCostInr: number;
  raConsLtrs: number;
  raCostInr: number;
  runHrs: number;
  prodRate: number;
  utilPct: number;
  avgLineSpeed: number;
};

type ConsumptionRow = {
  sn: number;
  param: string;
  uom: string;
  day: string | number;
  cumulative: number | string;
};

const makeCoilRows = (count = 30): CoilRow[] =>
  Array.from({ length: count }).map((_, i) => {
    const t = (h: number, m: number) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    const startH = 8 + (i % 10);
    const endH = startH + 2;
    const line = i % 2 === 0 ? 'Line-1' : 'Line-2';
    const qual = i % 7 === 0 ? 'Rework' : 'OK';
    const tankTemp = (base: number) => `${base + (i % 5)}°C`;
    const cond = (base: number) => `${(base + (i % 4) * 0.2).toFixed(1)} mS`;
    const dens = (base: number) => `${(base + (i % 3) * 0.02).toFixed(2)} g/cc`;
    const conc = (base: number) => `${(base + (i % 5)).toFixed(0)}%`;
    const ph = (base: number) => `${(base + (i % 3) * 0.2).toFixed(1)}`;

    return {
      sn: i + 1,
      coilId: `C-${2540 + i}-A`,
      grade: i % 3 === 0 ? 'SS-304' : 'SS-316',
      width: 1250 + (i % 5) * 10,
      weight: Number((10 + (i % 8) * 0.5).toFixed(1)),
      thick: Number((2.0 + (i % 4) * 0.1).toFixed(1)),
      lineSpeed: Number((40 + (i % 10) * 0.7).toFixed(1)),
      startTime: t(startH, 0),
      endTime: t(endH, 30),
      totalTime: `${endH - startH}:30`,
      output: Number((10 + (i % 5) * 0.7).toFixed(1)),
      prodRate: Number((12 + (i % 6) * 0.3).toFixed(1)),
      picklingLine: line,
      kwhTon: Number((280 + (i % 10) * 1).toFixed(0)),
      yieldPct: Number((95 + (i % 5) * 0.6).toFixed(1)),
      quality: qual,
      t1Temp: tankTemp(75), t1Cond: cond(3), t1Dens: dens(1.12), t1Conc: conc(12), t1pH: ph(1.2),
      t2Temp: tankTemp(70), t2Cond: cond(3.5), t2Dens: dens(1.15), t2Conc: conc(14), t2pH: ph(1.5),
      t3Temp: tankTemp(65), t3Cond: cond(4), t3Dens: dens(1.18), t3Conc: conc(16), t3pH: ph(1.8),
      rinseTemp: tankTemp(30), rinseCond: cond(0.5), rinsePH: ph(6.5),
    };
  });

const makeDailyRows = (count = 30): DailyRow[] =>
  Array.from({ length: count }).map((_, i) => ({
    sn: i + 1,
    date: `2025-10-${String(1 + (i % 30)).padStart(2, '0')}`,
    coils: 10 + (i % 10),
    inWt: Number((200 + (i % 20) * 2.5).toFixed(1)),
    outWt: Number((190 + (i % 20) * 2.4).toFixed(1)),
    yieldPct: Number((90 + (i % 10) * 0.7).toFixed(1)),
    tank1AvgTemp: `${78 + (i % 4)}°C`,
    tank1AvgConc: `${(14 + (i % 5) * 0.4).toFixed(1)}%`,
    tank2AvgTemp: `${76 + (i % 4)}°C`,
    tank2AvgConc: `${(13 + (i % 4) * 0.5).toFixed(1)}%`,
    tank3AvgTemp: `${74 + (i % 4)}°C`,
    tank3AvgConc: `${(12 + (i % 3) * 0.6).toFixed(1)}%`,
    rinseTemp: `${32 + (i % 3)}°C`,
    rinsePH: `${(6.5 + (i % 3) * 0.1).toFixed(1)}`,
    faConsLtrs: Number((110 + (i % 12) * 3.2).toFixed(1)),
    faCostInr: Number((4500 + (i % 12) * 120).toFixed(0)),
    raConsLtrs: Number((280 + (i % 15) * 4.5).toFixed(1)),
    raCostInr: Number((6700 + (i % 10) * 150).toFixed(0)),
    runHrs: Number((20 + (i % 5) * 0.5).toFixed(1)),
    prodRate: Number((10 + (i % 6) * 0.4).toFixed(1)),
    utilPct: Number((80 + (i % 15) * 1).toFixed(1)),
    avgLineSpeed: Number((65 + (i % 8) * 1.3).toFixed(1)),
  }));

const makeConsumptionRows = (count = 20): ConsumptionRow[] =>
  [
    'Fresh Acid (FA)',
    'Regenerated Acid (RA)',
    'Demineralized Water',
    'Electricity',
    'Gas',
    'Cooling Water',
  ]
    .slice(0, count)
    .map((p, i) => ({
      sn: i + 1,
      param: p,
      uom: i % 3 === 0 ? 'M³' : 'kWh',
      day: Number((Math.random() * 20).toFixed(1)),
      cumulative: Number((Math.random() * 1000).toFixed(1)),
    }));

// CSV helper
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
    <style>body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial;padding:20px;color:#e6eef8;background:#0b1220}table{width:100%;border-collapse:collapse}th,td{padding:6px;border:1px solid rgba(255,255,255,0.06);font-size:12px}th{background:rgba(255,255,255,0.03);text-align:left}</style>
  </head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
};

const HMI06Reports = () => {
  const [coilRows] = useState<CoilRow[] | any>(makeCoilRows(40));
  const [dailyRows] = useState<DailyRow[]>(makeDailyRows(40));
  const [consumptionRows] = useState<ConsumptionRow[]>(makeConsumptionRows(30));

  // Report type selector
  const [selectedReport, setSelectedReport] = useState<'COIL' | 'DAILY' | 'CONSUMPTION'>('COIL');

  // Controls per table
  const [coilQuery, setCoilQuery] = useState('');
  const [coilPage, setCoilPage] = useState(1);
  const [coilPageSize, setCoilPageSize] = useState(10);

  const [dailyQuery, setDailyQuery] = useState('');
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyPageSize, setDailyPageSize] = useState(10);

  const [consQuery, setConsQuery] = useState('');
  const [consPage, setConsPage] = useState(1);
  const [consPageSize, setConsPageSize] = useState(10);

  const [timePeriod, setTimePeriod] = useState('Last 7 Days');

  // Filtered datasets
  const filteredCoils = useMemo(() => {
    const q = coilQuery.trim().toLowerCase();
    return coilRows.filter((r: CoilRow) => {
      if (!q) return true;
      return (`${r.coilId} ${r.grade} ${r.width} ${r.output}`).toLowerCase().includes(q);
    });
  }, [coilRows, coilQuery]);

  const filteredDaily = useMemo(() => {
    const q = dailyQuery.trim().toLowerCase();
    return dailyRows.filter((r) => {
      if (!q) return true;
      return (`${r.date} ${r.coils} ${r.yieldPct}`).toLowerCase().includes(q);
    });
  }, [dailyRows, dailyQuery]);

  const filteredCons = useMemo(() => {
    const q = consQuery.trim().toLowerCase();
    return consumptionRows.filter((r) => {
      if (!q) return true;
      return (`${r.param} ${r.uom} ${r.cumulative}`).toLowerCase().includes(q);
    });
  }, [consumptionRows, consQuery]);

  // pagination helpers
  const paginate = (arr: any[], page: number, size: number) => {
    const pageCount = Math.max(1, Math.ceil(arr.length / size));
    const current = Math.min(page, pageCount);
    const start = (current - 1) * size;
    return { pageCount, current, rows: arr.slice(start, start + size), start, end: Math.min(start + size, arr.length) };
  };

  const coilsPage = paginate(filteredCoils, coilPage, coilPageSize);
  const dailyPageObj = paginate(filteredDaily, dailyPage, dailyPageSize);
  const consPageObj = paginate(filteredCons, consPage, consPageSize);

  // export handlers per table
  const exportCoils = () => {
    const headers = ['SN','Coil ID','Grade','Width','Weight','Thick','Line Speed (mpm)','Start Time','End Time','Total Time','Output (Ton)','Prod Rate (Ton/Hr)','Pickling Line','KWH/Ton','Coil Yield %','Quality','Tank1 Temp','Tank1 Cond','Tank1 Density','Tank1 Conc','Tank1 pH','Tank2 Temp','Tank2 Cond','Tank2 Density','Tank2 Conc','Tank2 pH','Tank3 Temp','Tank3 Cond','Tank3 Density','Tank3 Conc','Tank3 pH','Rinse Temp','Rinse pH'];
    const rows = filteredCoils.map((r: CoilRow) => [r.sn,r.coilId,r.grade,r.width,r.weight,r.thick,r.lineSpeed,r.startTime,r.endTime,r.totalTime,r.output,r.prodRate,r.picklingLine,r.kwhTon,r.yieldPct,r.quality,r.t1Temp,r.t1Cond,r.t1Dens,r.t1Conc,r.t1pH,r.t2Temp,r.t2Cond,r.t2Dens,r.t2Conc,r.t2pH,r.t3Temp,r.t3Cond,r.t3Dens,r.t3Conc,r.t3pH,r.rinseTemp,r.rinsePH]);
    exportCSV('coil_report.csv', headers, rows);
  };

  const printCoils = () => {
    const el = document.getElementById('coil-report');
    if (!el) return;
    printSection(el.innerHTML);
  };

  const exportDaily = () => {
    const headers = ['SN','Date','No. of Coils','I/P Wt (Tons)','O/P Wt (Tons)','Yield %','Tank-1 Avg Temp (°C)','Tank-1 Avg Conc (%wt)','Tank-2 Avg Temp (°C)','Tank-2 Avg Conc (%wt)','Tank-3 Avg Temp (°C)','Tank-3 Avg Conc (%wt)','Rinse Temp (°C)','Rinse pH','FA Cons. (ltrs)','FA Cost (INR)','RA Cons. (ltrs)','RA Cost (INR)','Runn. Hours (Hrs)','Prod. rate (T/Hr)','Avg. Utilzn %','Avg. Line Speed (mpm)'];
    const rows = filteredDaily.map((r: DailyRow) => [
      r.sn,
      r.date,
      r.coils,
      r.inWt,
      r.outWt,
      r.yieldPct,
      r.tank1AvgTemp,
      r.tank1AvgConc,
      r.tank2AvgTemp,
      r.tank2AvgConc,
      r.tank3AvgTemp,
      r.tank3AvgConc,
      r.rinseTemp,
      r.rinsePH,
      r.faConsLtrs,
      r.faCostInr,
      r.raConsLtrs,
      r.raCostInr,
      r.runHrs,
      r.prodRate,
      r.utilPct,
      r.avgLineSpeed,
    ]);
    exportCSV('daily_report.csv', headers, rows);
  };

  const printDaily = () => {
    const el = document.getElementById('daily-report');
    if (!el) return;
    printSection(el.innerHTML);
  };

  const exportCons = () => {
    const headers = ['SN','Parameter','UOM','Day','Cumulative'];
    const rows = filteredCons.map((r: ConsumptionRow) => [r.sn,r.param,r.uom,r.day,r.cumulative]);
    exportCSV('consumption_report.csv', headers, rows);
  };

  const printCons = () => {
    const el = document.getElementById('cons-report');
    if (!el) return;
    printSection(el.innerHTML);
  };

  useEffect(() => {
    // reset page when queries change
    setCoilPage(1);
  }, [coilQuery, coilPageSize]);

  useEffect(() => {
    setDailyPage(1);
  }, [dailyQuery, dailyPageSize]);

  useEffect(() => {
    setConsPage(1);
  }, [consQuery, consPageSize]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      {/* Report Type Selector */}
      <div className="glass-panel p-4 rounded">
        <label className="text-sm font-semibold text-muted-foreground mr-4">Select Report Type:</label>
        <Select value={selectedReport} onValueChange={(v) => setSelectedReport(v as 'COIL' | 'DAILY' | 'CONSUMPTION')}>
          <SelectTrigger className="w-48 hover:border-primary hover:bg-primary/8 hover:shadow-sm focus:border-primary focus:shadow-lg transition-all duration-200">
            <SelectValue placeholder={selectedReport} />
          </SelectTrigger>
          <SelectContent className="shadow-lg">
            <SelectItem value="COIL" className="hover:bg-primary/10 cursor-pointer">COIL</SelectItem>
            <SelectItem value="DAILY" className="hover:bg-primary/10 cursor-pointer">DAILY</SelectItem>
            <SelectItem value="CONSUMPTION" className="hover:bg-primary/10 cursor-pointer">CONSUMPTION</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coil Report */}
      {selectedReport === 'COIL' && (
      <div id="coil-report" className="hmi-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">COIL REPORT</h2>

          <div className="flex items-center gap-2">
            <Input placeholder="Search coils..." value={coilQuery} onChange={(e) => setCoilQuery(e.target.value)} className="w-64" />

            <Select value={String(coilPageSize)} onValueChange={(v) => setCoilPageSize(Number(v))}>
              <SelectTrigger className="w-36 hover:border-primary hover:bg-primary/8 hover:shadow-sm focus:border-primary focus:shadow-lg transition-all duration-200">
                <SelectValue placeholder={`Rows: ${coilPageSize}`} />
              </SelectTrigger>
              <SelectContent className="shadow-lg">
                <SelectItem value="5" className="hover:bg-primary/10 cursor-pointer">5</SelectItem>
                <SelectItem value="10" className="hover:bg-primary/10 cursor-pointer">10</SelectItem>
                <SelectItem value="20" className="hover:bg-primary/10 cursor-pointer">20</SelectItem>
                <SelectItem value="50" className="hover:bg-primary/10 cursor-pointer">50</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={exportCoils} className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printCoils} className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border border-border/40">
            <thead>
              <tr className="bg-muted/20">
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">SN</th>
                <th colSpan={5} className="py-2 px-2 border border-border/40 text-center font-semibold">Coil Data</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Line Speed (mpm)</th>
                <th colSpan={3} className="py-2 px-2 border border-border/40 text-center font-semibold">Coil Time</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Output</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Pickling Line</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">KWH/Ton</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Coil Yield %</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Quality</th>
                <th colSpan={5} className="py-2 px-2 border border-border/40 text-center font-semibold">Tank-1 data</th>
                <th colSpan={5} className="py-2 px-2 border border-border/40 text-center font-semibold">Tank-2 data</th>
                <th colSpan={5} className="py-2 px-2 border border-border/40 text-center font-semibold">Tank-3 data</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Rinse Tank</th>
              </tr>
              <tr className="bg-muted/20">
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Coil ID</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Grade</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Width</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Weight</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Thick</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Start Time</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">End Time</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Total</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Output (Ton)</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Prod Rate (Ton/Hr)</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Temp</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cond</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Density</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Conc.</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">pH</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Temp</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cond</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Density</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Conc.</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">pH</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Temp</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cond</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Density</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Conc.</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">pH</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Temp</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">pH</th>
              </tr>
            </thead>
            <tbody>
              {coilsPage.rows.map((row: CoilRow) => (
                <tr key={row.sn} className="hover:bg-primary/8 hover:shadow-sm transition-all duration-150 cursor-pointer">
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.sn}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.coilId}</td>
                  <td className="py-2 px-2 border border-border/30 text-center">{row.grade}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.width}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.weight.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.thick.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.lineSpeed.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.startTime}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.endTime}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.totalTime}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.output.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.prodRate.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.picklingLine}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.kwhTon}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono text-success">{`${row.yieldPct.toFixed(1)}%`}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.quality}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t1Temp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t1Cond}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t1Dens}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t1Conc}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t1pH}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t2Temp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t2Cond}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t2Dens}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t2Conc}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t2pH}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t3Temp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t3Cond}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t3Dens}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t3Conc}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.t3pH}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.rinseTemp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.rinsePH}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Showing {coilsPage.start + 1}-{coilsPage.end} of {filteredCoils.length} rows</div>
          <div className="flex items-center gap-2">
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={coilsPage.current === 1} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCoilPage(1)}>First</Button>
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={coilsPage.current === 1} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCoilPage((p) => Math.max(1, p - 1))}>« Prev</Button>
            {Array.from({ length: coilsPage.pageCount }).slice(0, 7).map((_, i) => (
              <Button key={i} {...({ variant: 'outline', size: 'sm' } as any)} className={coilsPage.current === i + 1 ? 'bg-primary text-primary-foreground border-primary' : ''} onClick={() => setCoilPage(i + 1)}>{i + 1}</Button>
            ))}
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={coilsPage.current === coilsPage.pageCount} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCoilPage((p) => Math.min(coilsPage.pageCount, p + 1))}>Next »</Button>
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={coilsPage.current === coilsPage.pageCount} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setCoilPage(coilsPage.pageCount)}>Last</Button>
          </div>
        </div>
      </div>
      )}

      {/* Daily Report */}
      {selectedReport === 'DAILY' && (
      <div id="daily-report" className="hmi-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">DAILY REPORT</h2>

          <div className="flex items-center gap-2">
            <Input placeholder="Search daily..." value={dailyQuery} onChange={(e) => setDailyQuery(e.target.value)} className="w-64" />

            <Select value={String(dailyPageSize)} onValueChange={(v) => setDailyPageSize(Number(v))}>
              <SelectTrigger className="w-36 hover:border-primary hover:bg-primary/8 hover:shadow-sm focus:border-primary focus:shadow-lg transition-all duration-200">
                <SelectValue placeholder={`Rows: ${dailyPageSize}`} />
              </SelectTrigger>
              <SelectContent className="shadow-lg">
                <SelectItem value="5" className="hover:bg-primary/10 cursor-pointer">5</SelectItem>
                <SelectItem value="10" className="hover:bg-primary/10 cursor-pointer">10</SelectItem>
                <SelectItem value="20" className="hover:bg-primary/10 cursor-pointer">20</SelectItem>
                <SelectItem value="50" className="hover:bg-primary/10 cursor-pointer">50</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={exportDaily} className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printDaily} className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border border-border/40">
            <thead>
              <tr className="bg-muted/20">
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">SN</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Date</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">No. of Coils</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">I/P Wt (Tons)</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">O/P Wt (Tons)</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Yield %</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Tank-1 data</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Tank-2 data</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Tank-3 data</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Rinse Tank</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">FA</th>
                <th colSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">RA</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Runn. Hours (Hrs)</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Prod. rate (T/Hr)</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Avg. Utilzn %</th>
                <th rowSpan={2} className="py-2 px-2 border border-border/40 text-center font-semibold">Avg. Line Speed (mpm)</th>
              </tr>
              <tr className="bg-muted/20">
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Avg Temp Deg C</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Avg Conc %wt</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Avg Temp Deg C</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Avg Conc %wt</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Avg Temp Deg C</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Avg Conc %wt</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Temp Deg C</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">pH</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cons. ltrs</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cost (INR)</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cons. ltrs</th>
                <th className="py-2 px-2 border border-border/40 text-center font-semibold">Cost (INR)</th>
              </tr>
            </thead>
            <tbody>
              {dailyPageObj.rows.map((row: DailyRow) => (
                <tr key={row.sn} className="hover:bg-primary/8 hover:shadow-sm transition-all duration-150 cursor-pointer">
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.sn}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.date}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.coils}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.inWt.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.outWt.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono text-success">{`${row.yieldPct.toFixed(1)}%`}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.tank1AvgTemp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.tank1AvgConc}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.tank2AvgTemp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.tank2AvgConc}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.tank3AvgTemp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.tank3AvgConc}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.rinseTemp}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.rinsePH}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.faConsLtrs.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.faCostInr.toLocaleString('en-IN')}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.raConsLtrs.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.raCostInr.toLocaleString('en-IN')}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.runHrs.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.prodRate.toFixed(1)}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono text-warning">{`${row.utilPct.toFixed(1)}%`}</td>
                  <td className="py-2 px-2 border border-border/30 text-center font-mono">{row.avgLineSpeed.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Showing {dailyPageObj.start + 1}-{dailyPageObj.end} of {filteredDaily.length} rows</div>
          <div className="flex items-center gap-2">
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={dailyPageObj.current === 1} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setDailyPage(1)}>First</Button>
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={dailyPageObj.current === 1} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setDailyPage((p) => Math.max(1, p - 1))}>« Prev</Button>
            {Array.from({ length: dailyPageObj.pageCount }).slice(0, 7).map((_, i) => (
              <Button key={i} {...({ variant: 'outline', size: 'sm' } as any)} className={dailyPageObj.current === i + 1 ? 'bg-primary text-primary-foreground border-primary' : ''} onClick={() => setDailyPage(i + 1)}>{i + 1}</Button>
            ))}
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={dailyPageObj.current === dailyPageObj.pageCount} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setDailyPage((p) => Math.min(dailyPageObj.pageCount, p + 1))}>Next »</Button>
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={dailyPageObj.current === dailyPageObj.pageCount} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setDailyPage(dailyPageObj.pageCount)}>Last</Button>
          </div>
        </div>
      </div>
      )}

      {/* Consumption Report */}
      {selectedReport === 'CONSUMPTION' && (
      <div id="cons-report" className="hmi-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">CONSUMPTION REPORT</h2>

          <div className="flex items-center gap-2">
            <div className="glass-panel p-2 rounded inline-flex items-center gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Time Period:</label>
              <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v)}>
                <SelectTrigger className="w-48 hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200">
                  <SelectValue placeholder={timePeriod} />
                </SelectTrigger>
                <SelectContent className="shadow-lg">
                  <SelectItem value="Last 7 Days" className="hover:bg-primary/10 cursor-pointer">Last 7 Days</SelectItem>
                  <SelectItem value="Last 30 Days" className="hover:bg-primary/10 cursor-pointer">Last 30 Days</SelectItem>
                  <SelectItem value="This Month" className="hover:bg-primary/10 cursor-pointer">This Month</SelectItem>
                  <SelectItem value="Last Month" className="hover:bg-primary/10 cursor-pointer">Last Month</SelectItem>
                  <SelectItem value="Custom Range" className="hover:bg-primary/10 cursor-pointer">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input placeholder="Search consumption..." value={consQuery} onChange={(e) => setConsQuery(e.target.value)} className="w-64" />

            <Select value={String(consPageSize)} onValueChange={(v) => setConsPageSize(Number(v))}>
              <SelectTrigger className="w-36 hover:border-primary hover:bg-primary/8 hover:shadow-sm focus:border-primary focus:shadow-lg transition-all duration-200">
                <SelectValue placeholder={`Rows: ${consPageSize}`} />
              </SelectTrigger>
              <SelectContent className="shadow-lg">
                <SelectItem value="5" className="hover:bg-primary/10 cursor-pointer">5</SelectItem>
                <SelectItem value="10" className="hover:bg-primary/10 cursor-pointer">10</SelectItem>
                <SelectItem value="20" className="hover:bg-primary/10 cursor-pointer">20</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={exportCons} className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={printCons} className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border border-border/40">
            <thead>
              <tr className="bg-muted/20">
                <th className="py-3 px-4 text-center font-semibold border border-border/40">SN</th>
                <th className="py-3 px-4 text-center font-semibold border border-border/40">Parameter Name</th>
                <th className="py-3 px-4 text-center font-semibold border border-border/40">UOM</th>
                <th className="py-3 px-4 text-center font-semibold border border-border/40">Day</th>
                <th className="py-3 px-4 text-center font-semibold border border-border/40">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {consPageObj.rows.map((row: ConsumptionRow) => (
                <tr key={row.sn} className="border-b border-border/30 hover:bg-primary/8 hover:shadow-sm transition-all duration-150 cursor-pointer">
                  <td className="py-3 px-4 font-mono text-center border border-border/30">{row.sn}</td>
                  <td className="py-3 px-4 font-medium text-center border border-border/30">{row.param}</td>
                  <td className="py-3 px-4 font-mono text-center border border-border/30">{row.uom}</td>
                  <td className="py-3 px-4 font-mono text-lg font-semibold text-primary text-center border border-border/30">{row.day}</td>
                  <td className="py-3 px-4 font-mono text-lg font-semibold text-center border border-border/30">{row.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">Showing {consPageObj.start + 1}-{consPageObj.end} of {filteredCons.length} rows</div>
          <div className="flex items-center gap-2">
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={consPageObj.current === 1} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setConsPage(1)}>First</Button>
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={consPageObj.current === 1} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setConsPage((p) => Math.max(1, p - 1))}>« Prev</Button>
            {Array.from({ length: consPageObj.pageCount }).slice(0, 7).map((_, i) => (
              <Button key={i} {...({ variant: 'outline', size: 'sm' } as any)} className={consPageObj.current === i + 1 ? 'bg-primary text-primary-foreground border-primary' : ''} onClick={() => setConsPage(i + 1)}>{i + 1}</Button>
            ))}
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={consPageObj.current === consPageObj.pageCount} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setConsPage((p) => Math.min(consPageObj.pageCount, p + 1))}>Next »</Button>
            <Button {...({ variant: 'outline', size: 'sm' } as any)} disabled={consPageObj.current === consPageObj.pageCount} className="disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setConsPage(consPageObj.pageCount)}>Last</Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default HMI06Reports;
