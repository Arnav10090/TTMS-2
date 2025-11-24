import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { format, startOfMonth, startOfYear } from 'date-fns'

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function rangeFactor(range: RangeMode, refDate: Date = new Date()): number {
  if (range === 'today') return 1
  if (range === 'monthly') return daysInMonth(refDate.getFullYear(), refDate.getMonth())
  return 360
}

export function scaleNumberByRange(value: number, range: RangeMode, refDate?: Date): number {
  const factor = rangeFactor(range, refDate)
  return value * factor
}

export function formatRangeText(range: RangeMode, now: Date = new Date()): string {
  if (range === 'today') {
    return `Data till ${format(now, 'MMM d, yyyy, p')}`
  }

  if (range === 'monthly') {
    const start = startOfMonth(now)
    return `Data from ${format(start, 'MMM d, yyyy')} – ${format(now, 'MMM d, yyyy')}`
  }

  // yearly
  const start = startOfYear(now)
  return `Data from ${format(start, 'MMM d, yyyy')} – ${format(now, 'MMM yyyy')}`
}
