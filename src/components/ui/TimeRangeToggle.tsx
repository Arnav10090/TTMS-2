"use client"

import { Dispatch, SetStateAction } from 'react'

export type RangeMode = 'today' | 'monthly' | 'yearly'

export default function TimeRangeToggle({ mode, setMode, onCompare, hideCompare }: { mode: RangeMode; setMode: Dispatch<SetStateAction<RangeMode>>; onCompare?: () => void; hideCompare?: boolean }) {
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
    <div className="flex items-center gap-2">
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
    </div>
  )
}
