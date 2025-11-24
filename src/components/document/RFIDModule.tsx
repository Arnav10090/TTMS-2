"use client"

import { useRef, useState } from 'react'
import SignaturePad, { SignaturePadHandle } from './SignaturePad'

export default function RFIDModule({ extraReady = true }: { extraReady?: boolean }) {
  const [rfid, setRfid] = useState('')
  const [tracking, setTracking] = useState('')
  const [hasSign, setHasSign] = useState(false)
  const sigRef = useRef<SignaturePadHandle | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)


  const applyTracking = () => {
    const value = rfid.trim()
    if (value) setTracking(value)
  }

  const clearSign = () => {
    sigRef.current?.clear()
  }

  const uploadSign = () => {
    uploadInputRef.current?.click()
  }

  const onUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await sigRef.current?.setImageFromFile(file)
    e.currentTarget.value = ''
  }

  const clearTracking = () => {
    setTracking('')
    setRfid('')
  }

  const canProceed = Boolean(tracking) && hasSign && extraReady

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
      <div>
        <label className="block text-sm text-slate-600 mb-1">Digital Signature <span className="text-red-600">*</span></label>
        <SignaturePad ref={sigRef} onChangeHasSignature={setHasSign} />
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={clearSign}
            className="px-3 py-1.5 rounded-ui border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={!hasSign}
          >
            Clear
          </button>
          <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadChange} />
          <button
            onClick={uploadSign}
            className="px-3 py-1.5 rounded-ui border border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            Upload Sign
          </button>
          <div className="ml-auto" />
          <button
            className={`px-4 py-2 rounded-ui ${canProceed ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
            disabled={!canProceed}
            title={!canProceed ? 'Complete all required fields (language, phones, location, RFID, signature)' : undefined}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
