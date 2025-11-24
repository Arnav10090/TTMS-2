"use client"

import { useEffect, useMemo, useState } from 'react'

type Gate = { id: string; available: boolean }

export default function GateSelector() {
  const [gates, setGates] = useState<Gate[]>(
    Array.from({ length: 12 }, (_, i) => ({ id: `G-${i+1}`, available: Math.random() > 0.3 }))
  )
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    const t = setInterval(() => {
      setGates((prev) => prev.map((g) => Math.random() > 0.85 ? { ...g, available: !g.available } : g))
    }, 5000)
    return () => clearInterval(t) 
  }, [])

  const map = useMemo(() => gates, [gates])

  return (
    <div>
      <label className="block text-sm text-slate-600 mb-1">Select Gate</label>
      <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border border-slate-300 rounded-ui px-3 py-2">
        <option value="">Choose a gate</option>
        {gates.map((g) => (
          <option key={g.id} value={g.id} disabled={!g.available}>{g.id} {g.available ? '(Available)' : '(Busy)'}</option>
        ))}
      </select>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {map.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelected(g.id)}
            className={`rounded-ui h-10 text-sm ${g.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} ${selected===g.id ? 'ring-2 ring-[#1e40af]' : ''}`}
          >
            {g.id}
          </button>
        ))}
      </div>
    </div>
  )
}
