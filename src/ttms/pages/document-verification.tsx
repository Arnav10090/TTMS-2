"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentUploadZone from '@/components/document/DocumentUploadZone'
import SearchableOrderList from '@/components/document/SearchableOrderList'
import RFIDModule from '@/components/document/RFIDModule'
import DriverHelperDetails from '@/components/document/DriverHelperDetails'
import { useState } from 'react'

export default function TTMSDocumentVerificationPage() {
  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const [vehicleRegNo, setVehicleRegNo] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [driverValid, setDriverValid] = useState(false)
  const [helperValid, setHelperValid] = useState(false)

  const validateAndSet = () => {
    const v = inputValue.trim()
    const pattern = /^[A-Z]{2}\d{2}-\d{4}$/
    if (!pattern.test(v)) {
      setError('Invalid format. Expected format: MH12-1001')
      return
    }
    setError(null)
    setVehicleRegNo(v)
  }

  const handleValidity = (v: { driver: boolean; helper: boolean }) => {
    if (typeof v.driver === 'boolean') setDriverValid(v.driver)
    if (typeof v.helper === 'boolean') setHelperValid(v.helper)
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-medium text-slate-600 mb-2"><p>Vehicle Reg No. (Eg. MH12-1001)</p></label>
            <div className="flex items-center gap-2 mb-3">
              <input value={inputValue} onChange={(e)=>setInputValue(e.target.value.toUpperCase())} placeholder="Enter vehicle reg no. e.g. MH12-1001" className="flex-1 text-sm px-2 py-1 border rounded-md" />
              <button onClick={validateAndSet} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Enter</button>
              <button onClick={() => { setInputValue(''); setVehicleRegNo(''); setError(null) }} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">Clear</button>
            </div>
            {error && <div role="alert" aria-live="assertive" className="text-sm text-red-600 mb-2">{error}</div>}
            <h3 className="font-medium text-slate-700 mb-3">Upload Documents</h3>
            <DocumentUploadZone onPreview={(url) => setModalSrc(url)} />
          </div>
          <div className="card p-4">
            <h3 className="font-medium text-slate-700 mb-3">Driver and Helper Details</h3>
            <DriverHelperDetails vehicleRegNo={vehicleRegNo} onValidationChange={handleValidity} />
          </div>
        </div>
        <div className="card p-4 xl:col-span-1 flex flex-col min-h-[600px]">
          <h3 className="font-medium text-slate-700 mb-3">Documents Uploaded by Customer</h3>
          <SearchableOrderList vehicleRegNo={vehicleRegNo} onOpen={(url) => setModalSrc(url)} />
        </div>
        <div className="card p-4 xl:col-span-1">
          <h3 className="font-medium text-slate-700 mb-3">RFID / Tracking Module</h3>
          <RFIDModule extraReady={driverValid && helperValid} />
        </div>
      </div>

      {modalSrc && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="relative bg-white rounded-ui shadow-card max-w-5xl w-full">
            <button
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-red-600 shadow border border-red-200 hover:bg-red-50"
              onClick={() => setModalSrc(null)}
              aria-label="Close document"
              title="Close"
            >
              ×
            </button>
            <div className="p-4">
              <img src={modalSrc} alt="Document preview" className="w-full h-[80vh] object-contain rounded-ui" />
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
