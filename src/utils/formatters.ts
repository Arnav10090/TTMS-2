import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { rangeFactor } from '@/utils/range'

export const formatNumber = (n: number) => new Intl.NumberFormat().format(n)

export function scaleDisplayValue(val: string | number, range: RangeMode, refDate: Date = new Date()): string | number {
  if (range === 'today') return val
  const factor = rangeFactor(range, refDate)
  const scaleNum = (n: number) => n * factor

  if (typeof val === 'number') {
    return scaleNum(val)
  }

  return val.replace(/-?\d+(?:\.\d+)?/g, (match) => {
    const num = parseFloat(match)
    if (Number.isNaN(num)) return match
    const scaled = Math.round(scaleNum(num))
    return formatNumber(scaled)
  })
}
