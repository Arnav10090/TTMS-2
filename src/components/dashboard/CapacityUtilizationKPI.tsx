import KPICard from '@/components/ui/KPICard'
import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { CapacityData } from '@/types/kpi'
import KPISmallChart from '@/components/charts/KPISmallChart'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleDisplayValue } from '@/utils/formatters'

export default function CapacityUtilizationKPI({
  data,
  loading,
  range
}: {
  data: CapacityData
  loading?: boolean
  range: RangeMode
}) {
  // Determine status based on utilization
  const getUtilizationStatus = (utilization: number) => {
    if (utilization >= 80) return { tone: 'green' as const, label: 'Optimal' }
    if (utilization >= 60) return { tone: 'yellow' as const, label: 'Moderate' }
    return { tone: 'red' as const, label: 'Low' }
  }

  const status = getUtilizationStatus(data.utilization)

  // Get trend icon
  const getTrendIcon = () => {
    if (data.trend.direction === 'up') return <TrendingUp size={12} />
    if (data.trend.direction === 'down') return <TrendingDown size={12} />
    return <Minus size={12} />
  }

  // Format trend value
  const trendText =
    typeof data.trend?.percentage === 'number'
      ? `${data.trend.direction === 'down' ? '-' : data.trend.direction === 'up' ? '+' : ''}${(+data.trend.percentage).toFixed(1)}%`
      : '0%'

  return (
    <KPICard
      title="Capacity Utilization"
      secondaryMetrics={[
        {
          label: 'Utilization',
          value: (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{data.utilization}%</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.tone === 'green' ? 'bg-emerald-100 text-emerald-700' :
                status.tone === 'yellow' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                {status.label}
              </span>
            </div>
          )
        },
        {
          label: 'Plant Capacity',
          value: scaleDisplayValue(data.plantCapacity, range)
        },
        {
          label: 'Trucks Inside Plant',
          value: scaleDisplayValue(data.trucksInside, range)
        },
        {
          label: 'Trend',
          value: (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span>{trendText}</span>
            </div>
          )
        },
      ]}
      trend={data.trend}
      tone={status.tone}
      icon={<Gauge size={16} />}
      loading={loading}
      footer={<div className="mt-8"><KPISmallChart metric="capacity" capacity={data} range={range} height="h-12" /></div>}
      rowVariant="pill"
    />
  )
}
