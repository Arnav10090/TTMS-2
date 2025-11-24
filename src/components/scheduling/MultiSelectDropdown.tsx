"use client"

import { useMemo, useState } from 'react'

export default function MultiSelectDropdown() {
  const options = useMemo(() => Array.from({ length: 20 }, (_, i) => ({ id: `opt-${i+1}`, label: `Option ${i+1}` })), [])
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())), [options, query])

  const toggle = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  const clearAll = () => setSelected([])

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">Dropdown Selector</h3>
        <button className="px-2 py-1 rounded-ui bg-slate-100" onClick={clearAll}>Clear all</button>
      </div>
      <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search options" className="border border-slate-300 rounded-ui px-3 py-2 mt-2 w-full" />
      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-auto pr-1">
        {filtered.map((o)=> (
          <label key={o.id} className={`px-2 py-1 rounded-ui border ${selected.includes(o.id)?'bg-[#e0f2fe] border-[#3b82f6]':'border-slate-200'}`}>
            <input type="checkbox" className="mr-2" checked={selected.includes(o.id)} onChange={()=>toggle(o.id)} />
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-600">Selected: {selected.join(', ')}</div>
    </div>
  )
}
