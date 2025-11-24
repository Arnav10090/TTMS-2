"use client"

import { RangeMode } from '@/components/ui/TimeRangeToggle'
import { formatRangeText } from '@/utils/range'

export default function TimeRangeHint({ mode }: { mode: RangeMode }) {
  const text = formatRangeText(mode)
  return (
    <p className="mt-1 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{text}</p>
  )
}
