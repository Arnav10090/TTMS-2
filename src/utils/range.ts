import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { format, startOfMonth, startOfYear, differenceInDays } from 'date-fns'

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function rangeFactor(range: RangeMode, refDate: Date = new Date(), customFrom?: string, customTo?: string): number {
  if (range === 'today') return 1
  if (range === 'monthly') return daysInMonth(refDate.getFullYear(), refDate.getMonth())
  if (range === 'custom' && customFrom && customTo) {
    const fromDate = new Date(customFrom)
    const toDate = new Date(customTo)
    const days = differenceInDays(toDate, fromDate)
    return Math.max(1, days)
  }
  return 360
}

export function scaleNumberByRange(value: number, range: RangeMode, refDate?: Date, customFrom?: string, customTo?: string): number {
  const factor = rangeFactor(range, refDate, customFrom, customTo)
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
