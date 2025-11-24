import KPICard from '@/components/ui/KPICard'
import { Truck } from 'lucide-react'
import { VehiclesData } from '@/types/kpi'
import KPISmallChart from '@/components/charts/KPISmallChart'
import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleDisplayValue } from '@/utils/formatters'

export default function VehicleSummaryKPI({ data, loading, range }: { data: VehiclesData; loading?: boolean; range: RangeMode }) {
  return (
    <KPICard
      title="Vehicle Summary"
      secondaryMetrics={[
        { label: 'Vehicles IN (Day)', value: scaleDisplayValue(data.inDay, range) },
        { label: 'Vehicles OUT (Day)', value: scaleDisplayValue(data.outDay, range) },
        { label: 'Vehicles IN (Cum)', value: scaleDisplayValue(data.inCum, range) },
        { label: 'Vehicles OUT (Cum)', value: scaleDisplayValue(data.outCum, range) },
      ]}
      trend={data.trend}
      tone={data.inDay >= data.target ? 'green' : 'yellow'}
      icon={<Truck size={18} />}
      loading={loading}
      footer={<div className="mt-8"><KPISmallChart metric="vehicles" vehicles={data} range={range} height="h-12" /></div>}
      rowVariant="pill"
    />
  )
}
