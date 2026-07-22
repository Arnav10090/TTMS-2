import { RangeMode } from '@/components/ui/TimeRangeToggle'

export const formatNumber = (n: number) => new Intl.NumberFormat().format(n)

export function scaleDisplayValue(val: string | number, range: RangeMode, refDate: Date = new Date()): string | number {
  // All time ranges (Today, Monthly, Yearly, Custom) now show the same real-time values
  // No scaling - all values start from 0 and increment together across all ranges
  return val
}
