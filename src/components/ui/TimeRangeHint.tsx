"use client"

import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { formatRangeText } from '@/utils/range'
import { format, parse } from 'date-fns'

export default function TimeRangeHint({ mode, customFrom, customTo }: { mode: RangeMode; customFrom?: string; customTo?: string }) {
  let text = formatRangeText(mode)

  if (mode === 'custom' && customFrom && customTo) {
    try {
      const fromDate = parse(customFrom, 'yyyy-MM-dd', new Date())
      const toDate = parse(customTo, 'yyyy-MM-dd', new Date())
      text = `Data from ${format(fromDate, 'MMM d, yyyy')} – ${format(toDate, 'MMM d, yyyy')}`
    } catch {
      text = `Custom date range: ${customFrom} to ${customTo}`
    }
  }

  return (
    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{text}</p>
  )
}
