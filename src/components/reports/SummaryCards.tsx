"use client"

import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { scaleNumberByRange } from '@/utils/range'

export default function SummaryCards({ horizontal = false, range = 'today' }: { horizontal?: boolean; range?: RangeMode } = {}) {
  const grad = 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)'

  const baseCards = [
    { title: 'Daily Truck Count', primary: { label: 'No. of Trucks', value: 48 }, metric: { name: 'Gate Entry', total: 685, avg: 14.3 } },
    { title: 'Tare Weight Metrics', primary: { label: 'No. of Trucks', value: 48 }, metric: { name: 'Tare Weight', total: 650, avg: 9.4 } },
    { title: 'Loading Metrics', primary: { label: 'No. of Trucks', value: 48 }, metric: { name: 'Loading', total: 1650, avg: 35 } },
    { title: 'Post-Loading Weight', primary: { label: 'No. of Trucks', value: 42 }, metric: { name: 'Weight after Loading', total: 765, avg: 18.2, unit: 'kg' } },
    { title: 'Gate Exit', primary: { label: 'No. of Trucks', value: 38 }, metric: { name: 'Gate Exit', total: 930, avg: 24.5 } },
  ] as const

  const cards = baseCards.map((c) => ({
    ...c,
    primary: { ...c.primary, value: Math.round(scaleNumberByRange(c.primary.value, range)) },
    metric: { ...c.metric, total: Math.round(scaleNumberByRange(c.metric.total, range)), avg: Math.round(scaleNumberByRange(c.metric.avg, range) * 10) / 10 },
  }))

  if (horizontal) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((c) => (
            <div key={c.title} className="card p-6" style={{ background: grad }}>
              <div className="text-white/90 text-lg font-bold">{c.title}</div>

              <div className="text-white text-2xl font-bold mt-2">
                {c.primary.label}- <span className="font-extrabold">{c.primary.value}</span>
              </div>

              <div className="mt-4 text-white text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span>Total {c.metric.name} time</span>
                  <span className="font-semibold">{c.metric.total} {(c.metric as any).unit ?? 'min'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Avg {c.metric.name} time</span>
                  <span className="font-semibold">{c.metric.avg} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-fr">
      {cards.map((c) => (
        <div key={c.title} className="card p-4" style={{ background: grad }}>
          <div className="text-white/90 text-sm">{c.title}</div>

          <div className="text-white text-xl font-bold mt-2">
            {c.primary.label}- <span className="font-extrabold">{c.primary.value}</span>
          </div>

          <div className="mt-4 text-white text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span>Total {c.metric.name} time</span>
              <span className="font-semibold">{c.metric.total} {(c.metric as any).unit ?? 'min'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Avg {c.metric.name} time</span>
              <span className="font-semibold">{c.metric.avg} min</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
