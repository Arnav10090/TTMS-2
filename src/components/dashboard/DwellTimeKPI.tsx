import KPICard from '@/components/ui/KPICard'
import { Clock } from 'lucide-react'
import { DwellData } from '@/types/kpi'
import KPISmallChart from '@/components/charts/KPISmallChart'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleDisplayValue } from '@/utils/formatters'

export default function DwellTimeKPI({ data, loading, range }: { data: DwellData; loading?: boolean; range: RangeMode }) {
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
      tone="blue"
      icon={<Clock size={16} />}
      loading={loading}
      rowVariant="pill"
    />
  )
}
