"use client"

import { useCallback, useEffect, useState } from 'react'
import { Upload, FileText, File, CreditCard, Car, FileCheck, Image, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type UploadedDoc = {
  file: File
  url: string
  uploadedDate: string
  type: 'aadhar' | 'car_papers' | 'purchase_order' | 'invoice' | 'license' | 'photo' | 'other'
  uploading?: boolean
  uploaded?: boolean
  error?: string
}

const getDocumentIcon = (type: UploadedDoc['type']) => {
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

const detectDocumentType = (filename: string): UploadedDoc['type'] => {
  const lower = filename.toLowerCase()
  if (lower.includes('aadhar') || lower.includes('aadhaar')) return 'aadhar'
  if (lower.includes('registration') || lower.includes('insurance') || lower.includes('puc')) return 'car_papers'
  if (lower.includes('purchase') || lower.includes('po')) return 'purchase_order'
  if (lower.includes('delivery') || lower.includes('invoice')) return 'invoice'
  if (lower.includes('license') || lower.includes('licence')) return 'license'
  if (lower.match(/\.(jpg|jpeg|png|gif)$/i)) return 'photo'
  return 'other'
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function DocumentUploadZone({
  onPreview,
  vehicleRegNo
}: {
  onPreview?: (url: string, filename?: string) => void
  vehicleRegNo?: string
}) {
  const [files, setFiles] = useState<UploadedDoc[]>([])
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = async (file: File, idx: number) => {
    console.log('uploadFile called', { file: file.name, idx, vehicleRegNo });

    if (!vehicleRegNo) {
      console.error('No vehicleRegNo provided - upload blocked');
      setFiles(prev => prev.map((f, i) =>
        i === idx ? { ...f, error: 'Please enter a vehicle registration number first', uploading: false } : f
      ))
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('vehicleRegNo', vehicleRegNo)

    console.log('Making upload request to http://localhost:3003/api/upload');

    try {
      const response = await fetch('http://localhost:3003/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      console.log('Upload response:', { ok: response.ok, status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Update with the server-side URL
      setFiles(prev => prev.map((f, i) =>
        i === idx ? {
          ...f,
          url: data.url,
          uploading: false,
          uploaded: true,
          uploadedDate: data.uploadedDate
        } : f
      ))
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map((f, i) =>
        i === idx ? {
          ...f,
          error: error instanceof Error ? error.message : 'Upload failed',
          uploading: false
        } : f
      ))
    }
  }

  const processFiles = useCallback((fileList: File[]) => {
    const mapped: UploadedDoc[] = fileList.map((f) => ({
      file: f,
      url: URL.createObjectURL(f), // Temporary blob URL for preview
      uploadedDate: new Date().toISOString().split('T')[0],
      type: detectDocumentType(f.name),
      uploading: true,
      uploaded: false
    }))

    setFiles((prev) => {
      const newFiles = [...prev, ...mapped]
      // Start uploading each file
      const startIdx = prev.length
      mapped.forEach((_, i) => {
        uploadFile(fileList[i], startIdx + i)
      })
      return newFiles
    })
  }, [vehicleRegNo])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const list = Array.from(e.dataTransfer.files || [])
    processFiles(list)
  }, [processFiles])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || [])
    processFiles(list)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeAt = useCallback((idx: number) => {
    setFiles((prev) => {
      const target = prev[idx]
      if (target && target.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.url.startsWith('blob:')) {
          URL.revokeObjectURL(f.url)
        }
      })
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
        <input type="file" multiple className="hidden" id="doc-upload" onChange={onChange} accept=".pdf,.jpg,.jpeg,.png,.gif" />
        <label htmlFor="doc-upload" className="mt-3 inline-block px-3 py-1.5 rounded-ui bg-[#1e40af] text-white cursor-pointer">Select Files</label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
            >
              <button
                onClick={() => doc.uploaded && onPreview?.(doc.url, doc.file.name)}
                disabled={!doc.uploaded}
                className="flex items-center gap-3 flex-1 text-left disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0">
                  {getDocumentIcon(doc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-blue-700">
                    {doc.file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doc.uploadedDate} • {formatFileSize(doc.file.size)}
                  </p>
                  {doc.error && (
                    <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {doc.error}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 ml-2">
                  {doc.uploading ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : doc.uploaded ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : doc.error ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
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
                  )}
                </div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeAt(idx) }}
                className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                aria-label="Delete document"
                title="Delete"
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
