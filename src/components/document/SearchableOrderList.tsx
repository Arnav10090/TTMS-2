"use client"

import { useEffect, useMemo, useState } from 'react'
import { FileText, File, CreditCard, Car, FileCheck, Image } from 'lucide-react'

type Document = {
  id: string
  name: string
  type: 'aadhar' | 'car_papers' | 'purchase_order' | 'invoice' | 'license' | 'photo'
  uploadedDate: string
  fileSize: string
}

const getDocumentIcon = (type: Document['type']) => {
  switch (type) {
    case 'aadhar':
      return <CreditCard className="w-5 h-5 text-blue-600" />
    case 'car_papers':
      return <Car className="w-5 h-5 text-green-600" />
    case 'purchase_order':
      return <FileCheck className="w-5 h-5 text-purple-600" />
    case 'invoice':
      return <FileText className="w-5 h-5 text-orange-600" />
    case 'license':
      return <CreditCard className="w-5 h-5 text-indigo-600" />
    case 'photo':
      return <Image className="w-5 h-5 text-pink-600" />
    default:
      return <File className="w-5 h-5 text-gray-600" />
  }
}

const generateDocPreviewUrl = (doc: Document): string => {
  const colors: Record<Document['type'], string> = {
    aadhar: '#2563eb',
    car_papers: '#10b981',
    purchase_order: '#7c3aed',
    invoice: '#f59e0b',
    license: '#4f46e5',
    photo: '#db2777',
  }
  const color = colors[doc.type] || '#0ea5e9'
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'><rect width='100%' height='100%' fill='${color}'/><rect x='40' y='40' width='720' height='920' rx='16' ry='16' fill='white'/><text x='60' y='140' font-family='Inter,Arial' font-size='36' fill='${color}' font-weight='700'>${doc.name}</text><text x='60' y='190' font-family='Inter,Arial' font-size='16' fill='#334155'>${doc.id} • ${doc.uploadedDate} • ${doc.fileSize}</text><g transform='translate(60,240)'><rect width='680' height='4' fill='#e2e8f0'/></g><text x='60' y='300' font-family='Inter,Arial' font-size='20' fill='#334155'>Preview generated for demo</text></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export default function CustomerDocumentsViewer({ vehicleRegNo, onOpen, openedSrc }: { vehicleRegNo?: string; onOpen?: (src: string) => void; openedSrc?: string | null }) {
  const [query, setQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  const documents: Document[] = useMemo(() => [
    { id: 'DOC-001', name: 'Aadhar Card', type: 'aadhar', uploadedDate: '2024-09-15', fileSize: '2.3 MB' },
    { id: 'DOC-002', name: 'Car Registration Papers', type: 'car_papers', uploadedDate: '2024-09-16', fileSize: '1.8 MB' },
    { id: 'DOC-003', name: 'Purchase Order #PO-2024-089', type: 'purchase_order', uploadedDate: '2024-09-20', fileSize: '458 KB' },
    { id: 'DOC-004', name: 'Vehicle Insurance Certificate', type: 'car_papers', uploadedDate: '2024-09-16', fileSize: '890 KB' },
    { id: 'DOC-005', name: 'Tax Invoice', type: 'invoice', uploadedDate: '2024-09-22', fileSize: '325 KB' },
    { id: 'DOC-006', name: 'Driving License', type: 'license', uploadedDate: '2024-09-15', fileSize: '1.2 MB' },
    { id: 'DOC-007', name: 'Vehicle Photo - Front', type: 'photo', uploadedDate: '2024-09-18', fileSize: '3.1 MB' },
    { id: 'DOC-008', name: 'PAN Card', type: 'aadhar', uploadedDate: '2024-09-15', fileSize: '1.5 MB' },
  ], [])

  const filtered = useMemo(() => {
    // Require vehicleRegNo to show documents. If provided, simulate documents uploaded for that vehicle by selecting a subset
    if (vehicleRegNo && vehicleRegNo.trim()) {
      const digits = vehicleRegNo.replace(/\D/g, '')
      const idx = digits ? parseInt(digits.slice(-1)) % documents.length : 0
      const out: Document[] = []
      for (let i = 0; i < Math.min(5, documents.length); i++) {
        out.push(documents[(idx + i) % documents.length])
      }
      return out.filter(doc => doc.name.toLowerCase().includes(query.toLowerCase()))
    }
    // No vehicleRegNo -> no documents shown
    return []
  }, [documents, query, vehicleRegNo])

  useEffect(() => {
    if (openedSrc === null) setSelectedDoc(null)
  }, [openedSrc])

  const handleDocumentClick = (doc: Document) => {
    setSelectedDoc(doc)
    const url = generateDocPreviewUrl(doc)
    if (onOpen) onOpen(url)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents..."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="space-y-2 flex-1 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No documents found</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleDocumentClick(doc)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  {getDocumentIcon(doc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doc.uploadedDate} • {doc.fileSize}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <svg
                  className="w-5 h-5 text-slate-400 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))
        )}
      </div>

    </div>
  )
}
