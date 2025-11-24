"use client"

export default function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: any }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8">
      <div className="fixed inset-0 bg-black/40" />
      <div className="relative bg-white rounded-md shadow-lg w-[96%] max-w-7xl p-6 z-10 h-[85vh] overflow-auto">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900">✕</button>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}
