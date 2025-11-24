"use client"

import { useEffect, useMemo, useState } from 'react'
import { Check, Clock } from 'lucide-react'

type Step = { key: string; label: string; desc: string }

const steps: Step[] = [
  { key: 'upload', label: 'Document Upload', desc: 'Upload and validate the required documents' },
  { key: 'verification', label: 'Document Verification', desc: 'OCR processing and validation in progress' },
  { key: 'gate', label: 'Gate Assignment', desc: 'Assigning appropriate gate based on load' },
  { key: 'rfid', label: 'RFID Tagging', desc: 'Tag and link RFID with consignment' },
  { key: 'final', label: 'Final Approval', desc: 'Final checks and approval' },
]

export default function ProgressTracker() {
  const [active, setActive] = useState(1) // start at Document Verification for demo
  const [eta, setEta] = useState(15)
  const [start, setStart] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // set start only on mount to avoid server/client mismatch
    setStart(Date.now())
    const t = setInterval(() => setEta((e) => Math.max(0, e - 1)), 60000)
    return () => clearInterval(t)
  }, [])

  const percent = useMemo(() => Math.round((active / (steps.length - 1)) * 100), [active])

  const timeForIndex = (idx: number) => {
    if (!start) return '--:--'
    const d = new Date(start + idx * 5 * 60000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <section aria-label="Verification Progress" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">Verification Progress</h3>
        <div className="text-right">
          <div className="text-blue-700 font-bold">{percent}%</div>
          <div className="text-xs text-slate-500">Est. {eta} min remaining</div>
        </div>
      </div>

      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex items-start justify-between gap-2">
        {steps.map((s, idx) => {
          const state = idx < active ? 'done' : idx === active ? 'current' : 'pending'
          return (
            <button
              type="button"
              key={s.key}
              onClick={() => setActive(idx)}
              className="flex-1 min-w-[80px] text-center focus:outline-none"
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={s.label}
            >
              <div className="flex items-center justify-center">
                <div
                  className={
                    'w-9 h-9 rounded-full flex items-center justify-center ring-2 transition-all cursor-pointer ' +
                    (state === 'done'
                      ? 'bg-green-500 text-white ring-green-100'
                      : state === 'current'
                      ? 'bg-blue-600 text-white ring-blue-100'
                      : 'bg-slate-200 text-slate-500 ring-slate-100 hover:ring-slate-200')
                  }
                >
                  {state === 'done' ? <Check size={18} /> : <Clock size={18} className={state === 'current' ? '' : 'opacity-60'} />}
                </div>
              </div>
              <div className={'mt-2 text-xs ' + (state === 'current' ? 'text-blue-700 font-medium' : 'text-slate-600 hover:text-slate-800')}>{s.label}</div>
              {state === 'done' && (
                <div className="text-[10px] text-slate-400 mt-0.5">{timeForIndex(idx)}</div>
              )}
            </button>
          )
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-ui p-3">
        <div className="text-sm text-slate-800"><span className="font-semibold">Current Step:</span> {steps[active].label}</div>
        <div className="text-xs text-slate-600 mt-1">{steps[active].desc}</div>
      </div>

      <div className="mt-2 flex gap-2">
        <button
          className="px-3 py-1.5 rounded-ui bg-blue-700 text-white shadow hover:opacity-95 active:translate-y-[1px]"
          onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
        >
          Next Step
        </button>
        <button
          className="px-3 py-1.5 rounded-ui bg-slate-100 text-slate-700"
          onClick={() => setActive((a) => Math.max(0, a - 1))}
        >
          Back
        </button>
      </div>
    </section>
  )
}
