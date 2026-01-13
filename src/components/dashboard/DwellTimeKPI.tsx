import KPICard from '@/components/ui/KPICard'
import { Clock } from 'lucide-react'
import { DwellData } from '@/types/kpi'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleDisplayValue } from '@/utils/formatters'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

export default function DwellTimeKPI({ data, loading, range }: { data: DwellData; loading?: boolean; range: RangeMode }) {
  const chartData = data.sparkline.map((item, idx) => ({ time: idx, value: item.v }))

  return (
    <KPICard
      title="Dwell Time"
      secondaryMetrics={[
        { label: 'Total Dwell (Day)', value: scaleDisplayValue(`${data.totalDwellDay} min`, range) },
        { label: 'Avg Dwell (Day)', value: scaleDisplayValue(`${data.avgDwellDay.toFixed(1)} min`, range) },
        { label: 'Total Ratio (Day)', value: scaleDisplayValue(`${data.totalDwellRatioDay.toFixed(2)}%`, range) },
        { label: 'Avg Ratio (Day)', value: scaleDisplayValue(`${data.avgDwellRatioDay.toFixed(2)}%`, range) },
      ]}
      trend={data.trend}
      tone="yellow"
      icon={<Clock size={16} />}
      loading={loading}
      footer={
        <div className="mt-8">
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                  }}
                  cursor={{ stroke: '#64748b', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
      rowVariant="pill"
    />
  )
}
