"use client"

import { useState } from 'react'

export default function ManualsList() {
  const [open, setOpen] = useState(true)
  const docs = Array.from({ length: 8 }, (_, i) => ({ id: i+1, name: `Manual ${i+1}`, thumb: `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80'><rect width='120' height='80' fill='%23f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-size='12'>Manual ${i+1}</text></svg>`)}` }))
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-800">Manuals / Drawings List</h3>
        <button className="px-2 py-1 rounded-ui bg-slate-100" onClick={()=>setOpen(!open)}>{open?'Collapse':'Expand'}</button>
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 max-h-56 overflow-auto pr-1">
          {docs.map((d)=> (
            <a key={d.id} href={d.thumb} target="_blank" className="border border-slate-200 rounded-ui overflow-hidden group">
              <img src={d.thumb} alt={d.name} className="w-full h-24 object-cover group-hover:opacity-90" />
              <div className="px-2 py-1 text-xs text-slate-700">{d.name}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  )}
