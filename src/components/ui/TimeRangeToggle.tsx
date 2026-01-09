"use client"

import { Dispatch, SetStateAction } from 'react'

export type RangeMode = 'today' | 'monthly' | 'yearly' | 'custom'

export default function TimeRangeToggle({
  mode,
  setMode,
  onCompare,
  hideCompare,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  mode: RangeMode
  setMode: Dispatch<SetStateAction<RangeMode>>
  onCompare?: () => void
  hideCompare?: boolean
  customFrom?: string
  customTo?: string
  onCustomFromChange?: (date: string) => void
  onCustomToChange?: (date: string) => void
}) {
  const btn = (m: RangeMode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={
        `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === m ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`
      }
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {!hideCompare && (
          <button
            onClick={() => onCompare && onCompare()}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Compare
          </button>
        )}
        {btn('today', 'Today')}
        {btn('monthly', 'Monthly')}
        {btn('yearly', 'Yearly')}
        {btn('custom', 'Custom')}
      </div>
      {mode === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-slate-700">From:</label>
          <input
            type="date"
            value={customFrom || ''}
            onChange={(e) => onCustomFromChange?.(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
          <label className="text-sm font-medium text-slate-700">To:</label>
          <input
            type="date"
            value={customTo || ''}
            onChange={(e) => onCustomToChange?.(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  )
}
