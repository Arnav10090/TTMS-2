import { TopInfoPanel } from '@/components/TopInfoPanel';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { Toggle } from '@/components/ui/toggle';
import { useMemo, useState } from 'react';

const daysInCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const genSeriesValue = (t: number, count: number, base: number, amp: number, phase: number) => {
  const s = Math.sin(((t + phase) / count) * 2 * Math.PI);
  return Number((base + amp * s).toFixed(2));
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay();
  const weekNumber = Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  return weekNumber;
};

const getOrdinalSuffix = (num: number) => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return num + 'st';
  if (j === 2 && k !== 12) return num + 'nd';
  if (j === 3 && k !== 13) return num + 'rd';
  return num + 'th';
};

const parameters = {
  picklingTank: [
    'Tank Level', 'Tank Temperature', 'Density', 'Cond.', 'FeCl2',
    'Total HCL', 'HCL - PV', 'HCL - SV', 'Flow (HCL/DM)'
  ],
  rinseTank: [
    'Level', 'Temp (#4 Only)', 'pH (#4 Only)', 'DM Water'
  ],
  hotRinseTank: ['Level', 'Temp'],
  rinseWaterStorage: ['Level'],
  hotAirDrier: ['Temp'],
  storageTank: ['Level', 'Density']
};

const legendItems = [
  { label: '#1 Tank', color: 'hsl(var(--primary))', dashed: false },
  { label: '#2 Tank', color: 'hsl(var(--destructive))', dashed: false },
  { label: '#3 Tank', color: 'hsl(var(--success))', dashed: false }
];

const parameterGroupLabels: Record<keyof typeof parameters, string> = {
  picklingTank: 'Pickling Tank',
  rinseTank: 'Rinse Tank',
  hotRinseTank: 'Hot Rinse Tank',
  rinseWaterStorage: 'Rinse Water Storage',
  hotAirDrier: 'Hot Air Drier',
  storageTank: 'Storage Tank'
};

const HMI04Trends = () => {
  const [selectedParam, setSelectedParam] = useState<{ group: keyof typeof parameters; label: string }>({
    group: 'picklingTank',
    label: parameters.picklingTank[0],
  });
  // default to day view (24-hour day)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');

  const { chartData, xLabel, xDomain, xTicks, xTickFormatter } = useMemo(() => {
    const now = new Date();
    const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Generate unique seed based on selected parameter
    const paramSeed = `${selectedParam.group}-${selectedParam.label}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const tank1Base = 80 + (paramSeed % 40);
    const tank2Base = 100 + (paramSeed % 50);
    const tank3Base = 120 + (paramSeed % 60);
    const tank1Amp = 10 + (paramSeed % 15);
    const tank2Amp = 8 + ((paramSeed * 2) % 18);
    const tank3Amp = 12 + ((paramSeed * 3) % 20);
    const tank1Phase = paramSeed % 10;
    const tank2Phase = (paramSeed * 2) % 10;
    const tank3Phase = (paramSeed * 3) % 10;

    // day: show hours from 0..currentHour (inclusive)
    if (timeframe === 'day') {
      const start = 0;
      const end = now.getHours(); // current hour (0-23)
      const count = Math.max(1, end - start + 1);
      const data = Array.from({ length: count }, (_, i) => {
        const t = start + i;
        return {
          time: t,
          tank1: genSeriesValue(i, count, tank1Base, tank1Amp, tank1Phase),
          tank2: genSeriesValue(i, count, tank2Base, tank2Amp, tank2Phase),
          tank3: genSeriesValue(i, count, tank3Base, tank3Amp, tank3Phase),
        };
      });

      const ticks = data.map((d) => d.time);
      const domain: [number, number] = [start, start + count - 1];
      
      const dayLabel = `${getOrdinalSuffix(now.getDate())} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      return {
        chartData: data,
        xLabel: dayLabel,
        xDomain: domain,
        xTicks: ticks,
        xTickFormatter: (t: number) => `${t}:00`,
      };
    }

    // week: show weekdays starting Monday up to current weekday
    if (timeframe === 'week') {
      // JS: 0 = Sun, 1 = Mon ... 6 = Sat. Convert to 0 = Mon .. 6 = Sun
      const todayIdx = (new Date().getDay() + 6) % 7;
      const start = 0;
      const count = Math.max(1, todayIdx - start + 1);
      const data = Array.from({ length: count }, (_, i) => {
        const t = start + i; // 0..todayIdx
        return {
          time: t,
          tank1: genSeriesValue(i, count, tank1Base, tank1Amp, tank1Phase),
          tank2: genSeriesValue(i, count, tank2Base, tank2Amp, tank2Phase),
          tank3: genSeriesValue(i, count, tank3Base, tank3Amp, tank3Phase),
        };
      });

      const ticks = data.map((d) => d.time);
      const domain: [number, number] = [start, start + count - 1];
      
      const weekNum = getWeekOfMonth(now);
      const weekLabel = `${getOrdinalSuffix(weekNum)} week of ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      return {
        chartData: data,
        xLabel: weekLabel,
        xDomain: domain,
        xTicks: ticks,
        xTickFormatter: (t: number) => weekLabels[t] ?? String(t),
      };
    }

    // month: show days starting at 1 up to today's date (1..today)
    const daysInMonth = daysInCurrentMonth();
    const today = now.getDate();
    const start = 1;
    const end = Math.min(daysInMonth, today);
    const count = Math.max(1, end - start + 1);

    const data = Array.from({ length: count }, (_, i) => {
      const t = start + i;
      return {
        time: t,
        tank1: genSeriesValue(i, count, tank1Base, tank1Amp, tank1Phase),
        tank2: genSeriesValue(i, count, tank2Base, tank2Amp, tank2Phase),
        tank3: genSeriesValue(i, count, tank3Base, tank3Amp, tank3Phase),
      };
    });

    const ticks = data.map((d) => d.time);
    const domain: [number, number] = [start, start + count - 1];
    
    const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    return {
      chartData: data,
      xLabel: monthLabel,
      xDomain: domain,
      xTicks: ticks,
      xTickFormatter: (t: number) => String(t),
    };
  }, [timeframe, selectedParam]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <TopInfoPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameter Selection Panel */}
        <div className="hmi-card">
          <h2 className="panel-title">List of Parameters</h2>
          
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {/* Pickling Tank Parameters */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Pickling Tank (n=1,2,3)</h3>
              <div className="space-y-2">
                {parameters.picklingTank.map((param) => (
                  <Toggle
                    key={param}
                    pressed={selectedParam.group === 'picklingTank' && selectedParam.label === param}
                    onPressedChange={() => setSelectedParam({ group: 'picklingTank', label: param })}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    {param}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* Rinse Tank Parameters */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Rinse Tank (n=1,2,3,4)</h3>
              <div className="space-y-2">
                {parameters.rinseTank.map((param) => (
                  <Toggle
                    key={param}
                    pressed={selectedParam.group === 'rinseTank' && selectedParam.label === param}
                    onPressedChange={() => setSelectedParam({ group: 'rinseTank', label: param })}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    {param}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* Hot Rinse Tank */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Hot Rinse Tank</h3>
              <div className="space-y-2">
                {parameters.hotRinseTank.map((param) => (
                  <Toggle
                    key={param}
                    pressed={selectedParam.group === 'hotRinseTank' && selectedParam.label === param}
                    onPressedChange={() => setSelectedParam({ group: 'hotRinseTank', label: param })}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    {param}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* Rinse Water Storage */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Rinse Water Storage</h3>
              <div className="space-y-2">
                {parameters.rinseWaterStorage.map((param) => (
                  <Toggle
                    key={param}
                    pressed={selectedParam.group === 'rinseWaterStorage' && selectedParam.label === param}
                    onPressedChange={() => setSelectedParam({ group: 'rinseWaterStorage', label: param })}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    {param}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* Hot Air Drier */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Hot Air Drier</h3>
              <div className="space-y-2">
                {parameters.hotAirDrier.map((param) => (
                  <Toggle
                    key={param}
                    pressed={selectedParam.group === 'hotAirDrier' && selectedParam.label === param}
                    onPressedChange={() => setSelectedParam({ group: 'hotAirDrier', label: param })}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    {param}
                  </Toggle>
                ))}
              </div>
            </div>

            {/* Storage Tank */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-3">Storage Tank (n=1,2,3)</h3>
              <div className="space-y-2">
                {parameters.storageTank.map((param) => (
                  <Toggle
                    key={param}
                    pressed={selectedParam.group === 'storageTank' && selectedParam.label === param}
                    onPressedChange={() => setSelectedParam({ group: 'storageTank', label: param })}
                    variant="outline"
                    className="w-full justify-start text-sm"
                  >
                    {param}
                  </Toggle>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Graph Panel */}
        <div className="lg:col-span-2 hmi-card">
          <h2 className="panel-title">Parameter Trend</h2>
          
          <div className="glass-panel p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 25, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={xDomain}
                  ticks={xTicks}
                  interval={0}
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                  tickMargin={8}
                  tickFormatter={xTickFormatter as any}
                >
                  <Label
                    value={xLabel}
                    position="bottom"
                    offset={20}
                    style={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                </XAxis>
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickMargin={4}
                  domain={["auto", "auto"]}
                >
                  <Label
                    value={`${parameterGroupLabels[selectedParam.group]} - ${selectedParam.label}`}
                    angle={-90}
                    position="left"
                    offset={0}
                    style={{ fill: 'hsl(var(--muted-foreground))', textAnchor: 'middle' }}
                  />
                </YAxis>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Line
                  type="monotone"
                  dataKey="tank1"
                  stroke="#0891b2"
                  strokeWidth={2}
                  name="#1 Tank"
                  dot={false}
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="tank2"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="#2 Tank"
                  dot={false}
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="tank3"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="#3 Tank"
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex justify-center mt-6">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="block h-0 w-8"
                      style={{ borderBottom: `2px ${item.dashed ? 'dashed' : 'solid'} ${item.color}` }}
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setTimeframe('day')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  timeframe === 'day' ? 'bg-primary/20 text-primary' : 'hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  timeframe === 'week' ? 'bg-primary/20 text-primary' : 'hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  timeframe === 'month' ? 'bg-primary/20 text-primary' : 'hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HMI04Trends;
