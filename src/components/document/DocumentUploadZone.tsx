"use client"

import { useCallback, useEffect, useState } from 'react'
import { Upload, CheckCircle2, XCircle, Trash2 } from 'lucide-react'

export default function DocumentUploadZone({ onPreview }: { onPreview?: (url: string) => void }) {
  const [files, setFiles] = useState<Array<{file: File; url: string; valid: boolean}>>([])
  const [dragOver, setDragOver] = useState(false)

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    const list = Array.from(e.dataTransfer.files || [])
    const mapped = list.map((f) => ({ file: f, url: URL.createObjectURL(f), valid: Math.random() > 0.1 }))
    setFiles((prev) => [...prev, ...mapped])
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || [])
    const mapped = list.map((f) => ({ file: f, url: URL.createObjectURL(f), valid: Math.random() > 0.1 }))
    setFiles((prev) => [...prev, ...mapped])
  }

  const removeAt = useCallback((idx: number) => {
    setFiles((prev) => {
      const target = prev[idx]
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  // Revoke all created URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.url))
    }
  }, [files])

  const border = dragOver ? 'border-blue-600 bg-blue-50' : 'border-slate-300'

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-ui border-2 border-dashed p-4 md:p-5 text-center transition ${border}`}
      >
        <Upload className="mx-auto text-slate-400" />
        <p className="text-slate-600 mt-2">Drag and drop documents here, or click to upload</p>
        <input type="file" multiple className="hidden" id="doc-upload" onChange={onChange} />
        <label htmlFor="doc-upload" className="mt-3 inline-block px-3 py-1.5 rounded-ui bg-[#1e40af] text-white cursor-pointer">Select Files</label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-ui overflow-hidden border border-slate-200 bg-white hover:shadow">
              <button onClick={() => onPreview?.(f.url)} className="block w-full text-left">
                <img src={f.url} alt={f.file.name} className="w-full h-28 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                <div className="absolute top-1 right-1">
                  {f.valid ? <CheckCircle2 className="text-[#059669]" /> : <XCircle className="text-[#dc2626]" />}
                </div>
                <div className="absolute bottom-0 left-0 right-0 text-[10px] p-1 bg-white/80 truncate">{f.file.name}</div>
              </button>
              <button
                aria-label="Delete file"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); removeAt(i) }}
                className="absolute top-1 left-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-red-600 shadow hover:bg-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
