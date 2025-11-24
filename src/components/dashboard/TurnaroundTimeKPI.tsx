import KPICard from '@/components/ui/KPICard'
import { Timer } from 'lucide-react'
import { TurnaroundData } from '@/types/kpi'
import KPISmallChart from '@/components/charts/KPISmallChart'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleDisplayValue } from '@/utils/formatters'

export default function TurnaroundTimeKPI({ data, loading, range }: { data: TurnaroundData; loading?: boolean; range: RangeMode }) {
  return (
    <KPICard
      title="Turnaround Time"
      secondaryMetrics={[
        { label: 'Avg TTR (Day)', value: scaleDisplayValue(`${data.avgDay} min`, range) },
        { label: 'Avg TTR (Cum)', value: scaleDisplayValue(`${data.avgCum} min`, range) },
        { label: 'Last Year', value: scaleDisplayValue(`${data.lastYear} min`, range) },
      ]}
      trend={data.trend}
      tone={data.performanceColor}
      icon={<Timer size={16} />}
      loading={loading}
      footer={<div className="mt-8"><KPISmallChart metric="ttr" turnaround={data} range={range} height="h-16" /></div>}
      rowVariant="pill"
    />
  )
}
