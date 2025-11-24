import KPICard from '@/components/ui/KPICard'
import { DispatchData } from '@/types/kpi'
import KPISmallChart from '@/components/charts/KPISmallChart'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleDisplayValue } from '@/utils/formatters'

export default function DispatchSummaryKPI({ data, loading, range }: { data: DispatchData; loading?: boolean; range: RangeMode }) {
  const pct = Math.round((data.today / data.targetDay) * 100)
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const year = now.getFullYear()
  const primaryLabelPrefix =
    range === 'monthly' ? `Dispatched in ${monthName}` : range === 'yearly' ? `Dispatched in ${year}` : 'Dispatched Today'

  return (
    <KPICard
      title="Dispatch Summary"
      primaryValue={`${primaryLabelPrefix} ${scaleDisplayValue(data.today, range)}`}
      secondaryMetrics={[
        { label: range === 'yearly' ? 'Cum for the Year' : 'Cum for the Month', value: scaleDisplayValue(data.cumMonth, range) },
        { label: 'Target Day', value: scaleDisplayValue(data.targetDay, range) },
      ]}
      trend={data.trend}
      tone={pct >= 100 ? 'green' : pct >= 70 ? 'yellow' : 'red'}
      rowVariant="pill"
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-iron-coil">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.5" />
          <path d="M4 12h3" />
          <path d="M17 12h3" />
        </svg>
      }
      loading={loading}
      footer={<div className="mt-8"><KPISmallChart metric="dispatch" dispatch={data} range={range} height="h-28" /></div>}
    />
  )
}
