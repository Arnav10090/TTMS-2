"use client"

import { useRef, useState } from 'react'

export default function RFIDModule({ extraReady = true }: { extraReady?: boolean }) {
  const [rfid, setRfid] = useState('')
  const [tracking, setTracking] = useState('')


  const applyTracking = () => {
    const value = rfid.trim()
    if (value) setTracking(value)
  }

  const clearTracking = () => {
    setTracking('')
    setRfid('')
  }

  const canProceed = Boolean(tracking)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-slate-600 mb-1">RFID Tracking no. Input <span className="text-red-600">*</span></label>
        <div className="flex gap-2">
          <input
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyTracking() }}
            placeholder="Assign Tracking No."
            className="flex-1 border border-slate-300 rounded-ui px-3 py-2"
            aria-required
            required
          />
          <button
            onClick={applyTracking}
            className="px-4 py-2 rounded-ui bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={!rfid.trim()}
            aria-label="Enter tracking number"
          >
            Enter
          </button>
          <button
            onClick={clearTracking}
            className="px-4 py-2 rounded-ui border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={!tracking && !rfid}
            aria-label="Clear tracking number"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Tracking No:</span>
        {tracking ? (
          <span className="font-mono font-semibold">{tracking}</span>
        ) : (
          <span className="text-slate-400">None</span>
        )}
        <button
          onClick={clearTracking}
          className="ml-auto px-2 py-1 rounded-ui text-xs border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          disabled={!tracking}
        >
          Clear
        </button>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div className="ml-auto" />
        <button
          className={`px-4 py-2 rounded-ui ${canProceed ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
          disabled={!canProceed}
          title={!canProceed ? 'Enter an RFID tracking number to proceed' : undefined}
        >
          Proceed
        </button>
      </div>
    </div>
  )
}
