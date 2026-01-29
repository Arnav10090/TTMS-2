"use client"

import { useRef, useState } from 'react'

export default function RFIDModule({ onProceed, isLoading = false }: { onProceed?: (tracking: string) => void; isLoading?: boolean }) {
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
      <div className="flex items-center gap-2 text-lg text-slate-600">
        <span className="font-medium">Tracking No:</span>
        {tracking ? (
          <span className="font-mono font-semibold text-base">{tracking}</span>
        ) : (
          <span className="text-slate-400">None</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <div className="ml-auto" />
        <button
          onClick={() => onProceed?.(tracking)}
          className="px-4 py-2 rounded-ui bg-green-600 hover:bg-green-700 text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Processing...' : 'Proceed'}
        </button>
      </div>
    </div>
  )
}
