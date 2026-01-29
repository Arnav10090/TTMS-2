"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentUploadZone from '@/components/document/DocumentUploadZone'
import SearchableOrderList from '@/components/document/SearchableOrderList'
import RFIDModule from '@/components/document/RFIDModule'
import DriverHelperDetails from '@/components/document/DriverHelperDetails'
import VehicleQueueTable from '@/components/document/VehicleQueueTable'
import { useState, useRef } from 'react'
import { useRealTimeData } from '@/hooks/useRealTimeData'

export default function TTMSDocumentVerificationPage() {
  const { vehicleData } = useRealTimeData()
  const formRef = useRef<HTMLDivElement>(null)

  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const [vehicleRegNo, setVehicleRegNo] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [driverValid, setDriverValid] = useState(false)
  const [helperValid, setHelperValid] = useState(false)
  const [driverPhoneVerified, setDriverPhoneVerified] = useState(false)
  const [helperPhoneVerified, setHelperPhoneVerified] = useState(false)
  const [checklist, setChecklist] = useState({
    purchaseOrder: false,
    vehicleRegistration: false,
    vehiclePUC: false,
    vehicleInsurance: false,
    driverDetails: false,
    driverUniqueId: false,
    helperDetails: false,
    helperUniqueId: false,
  })

  const checklistItems = [
    { key: 'purchaseOrder', label: 'Purchase Order OK', required: true },
    { key: 'vehicleRegistration', label: 'Vehicle Registration OK', required: true },
    { key: 'vehiclePUC', label: 'Vehicle PUC OK', required: true },
    { key: 'vehicleInsurance', label: 'Vehicle Insurance OK', required: true },
    { key: 'driverDetails', label: 'Driver Details OK', required: true },
    { key: 'driverUniqueId', label: 'Driver Unique ID OK', required: true },
    { key: 'helperDetails', label: 'Helper Details OK', required: false },
    { key: 'helperUniqueId', label: 'Helper Unique ID OK', required: false },
  ]

  const getRequiredChecklistItems = () => {
    return checklistItems.filter(item => item.required)
  }

  const getMissingFields = (tracking: string) => {
    const missing: string[] = []

    if (!vehicleRegNo) missing.push('Vehicle Registration Number')
    if (!driverValid) missing.push('Driver Details (with OTP verification)')
    if (!tracking) missing.push('RFID Tracking Number')

    const requiredItems = getRequiredChecklistItems()
    requiredItems.forEach(item => {
      if (!checklist[item.key as keyof typeof checklist]) {
        missing.push(item.label)
      }
    })

    return missing
  }

  const handleProceed = (tracking: string) => {
    const missing = getMissingFields(tracking)
    if (missing.length > 0) {
      alert(`Please complete the following required fields:\n\n${missing.map(f => `• ${f}`).join('\n')}`)
    } else {
      alert('All required fields are complete. Proceeding...')
    }
  }

  const handleChecklistChange = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key as keyof typeof checklist] }))
  }

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

  const handleVerifyDocs = (regNo: string) => {
    setInputValue(regNo)
    setVehicleRegNo(regNo)
    setError(null)
    // Scroll to form section
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <VehicleQueueTable
          vehicles={vehicleData}
          onVerifyDocs={handleVerifyDocs}
          actionButton={
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-ui bg-blue-600 text-white text-base font-medium hover:bg-blue-700 transition-colors"
            >
              Manual Registration →
            </a>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch" ref={formRef}>
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-medium text-slate-600 mb-2"><p>Vehicle Reg No. (Eg. MH12-1001)</p></label>
            <div className="flex items-center gap-2 mb-3">
              <input value={inputValue} onChange={(e)=>setInputValue(e.target.value.toUpperCase())} placeholder="Enter vehicle reg no. e.g. MH12-1001" className="flex-1 text-sm px-2 py-1 border rounded-md" />
              <button onClick={validateAndSet} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Enter</button>
              <button onClick={() => { setInputValue(''); setVehicleRegNo(''); setError(null) }} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">Clear</button>
            </div>
            {error && <div role="alert" aria-live="assertive" className="text-sm text-red-600 mb-2">{error}</div>}
          </div>
          <div className="card p-4">
            <h3 className="font-medium text-slate-700 mb-3">Driver and Helper Details</h3>
            <DriverHelperDetails vehicleRegNo={vehicleRegNo} onValidationChange={handleValidity} />
          </div>
        </div>
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="font-medium text-slate-700 mb-3">Upload Documents</h3>
            <DocumentUploadZone onPreview={(url) => setModalSrc(url)} />
          </div>
          <div className="card p-4 flex flex-col min-h-[400px]">
            <h3 className="font-medium text-slate-700 mb-3">Documents Uploaded by Customer</h3>
            <SearchableOrderList vehicleRegNo={vehicleRegNo} onOpen={(url) => setModalSrc(url)} />
          </div>
        </div>
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="font-medium text-slate-700 mb-4">Document Confirmation Checklist</h3>
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={checklist[item.key as keyof typeof checklist]}
                    onChange={() => handleChecklistChange(item.key)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <label htmlFor={item.key} className="text-sm text-slate-600 cursor-pointer">
                    {item.label}
                    {item.required && <span className="text-red-600 ml-1">*</span>}
                    {!item.required && <span className="text-slate-400 text-xs ml-1">(optional)</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-medium text-slate-700 mb-3">RFID / Tracking Module</h3>
            <RFIDModule onProceed={handleProceed} />
          </div>
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
