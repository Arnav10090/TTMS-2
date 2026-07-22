"use client"

import DocumentUploadZone from '@/components/document/DocumentUploadZone'
import SearchableOrderList from '@/components/document/SearchableOrderList'
import { DocumentRenderer } from '@/components/document/DocumentRenderer'
import RFIDModule from '@/components/document/RFIDModule'
import DriverHelperDetails from '@/components/document/DriverHelperDetails'
import VehicleQueueTable from '@/components/document/VehicleQueueTable'
import { rfidAssignmentService } from '@/utils/rfidAssignments'
import { useState, useRef } from 'react'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import { getVehicleByIndex } from '@/utils/vehicleData'

export default function TTMSDocumentVerificationPage() {
  const { vehicleData } = useRealTimeData()
  const formRef = useRef<HTMLDivElement>(null)

  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState<boolean>(true)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [vehicleRegNo, setVehicleRegNo] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [driverValid, setDriverValid] = useState(false)
  const [helperValid, setHelperValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
    if (!helperValid) missing.push('Helper Details (with OTP verification)')
    if (!tracking) missing.push('RFID Tracking Number')

    const requiredItems = getRequiredChecklistItems()
    requiredItems.forEach(item => {
      if (!checklist[item.key as keyof typeof checklist]) {
        missing.push(item.label)
      }
    })

    return missing
  }

  const normalizeRegNo = (r: string) => r.replace(/\s|-/g, '').toUpperCase()

  const handleProceed = (tracking: string) => {
    const missing = getMissingFields(tracking)
    if (missing.length > 0) {
      alert(`Please complete the following required fields:\n\n${missing.map(f => `• ${f}`).join('\n')}`)
      return
    }

    // Persist RFID assignment so other parts of the app (dashboard) can read it
    try {
      const key = normalizeRegNo(vehicleRegNo || '')
      if (key) {
        rfidAssignmentService.saveAssignment(key, tracking)
        console.log('TTMS document-verification: saved RFID assignment', { key, tracking })
        // Clear gate entry pending marker when RFID is saved
        try {
          const pKey = 'vehicleGateEntryPending'
          const raw = localStorage.getItem(pKey)
          const map = raw ? JSON.parse(raw) as Record<string, string> : {}
          if (map[key]) { delete map[key]; localStorage.setItem(pKey, JSON.stringify(map)); window.dispatchEvent(new Event('vehicleGateEntryPending-updated')) }
        } catch { }
      } else {
        console.warn('TTMS document-verification: vehicleRegNo empty, not saving RFID')
      }
    } catch (err) {
      console.error('Failed to save RFID assignment:', err)
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      // Mark this vehicle as verified in localStorage
      try {
        const verifiedKey = 'verifiedVehicles'
        const raw = localStorage.getItem(verifiedKey)
        const verifiedList: string[] = raw ? JSON.parse(raw) : []
        const normalizedReg = normalizeRegNo(vehicleRegNo)
        if (!verifiedList.includes(normalizedReg)) {
          verifiedList.push(normalizedReg)
          localStorage.setItem(verifiedKey, JSON.stringify(verifiedList))
          window.dispatchEvent(new Event('verifiedVehicles-updated'))
        }
      } catch { }
      alert(`Documents of Vehicle no. ${vehicleRegNo} verified successfully!`)
    }, 2000)
  }

  const handleChecklistChange = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key as keyof typeof checklist] }))
  }

  const validateAndSet = () => {
    const v = inputValue.trim()
    // Support new format MH12AB1234 and old format MH12-1234
    const pattern = /^[A-Z]{2}\d{2}[A-Z]{0,2}-?\d{4}$/
    if (!pattern.test(v)) {
      setError('Invalid format. Expected format: MH12AB1234')
      return
    }
    // Strict validation optional for demo flexibility
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
    // Mark gate entry as pending/ongoing for this vehicle so Scheduling/Dashboard can show it
    try {
      const key = 'vehicleGateEntryPending'
      const raw = localStorage.getItem(key)
      const map = raw ? JSON.parse(raw) as Record<string, string> : {}
      map[normalizeRegNo(regNo)] = new Date().toISOString()
      localStorage.setItem(key, JSON.stringify(map))
      window.dispatchEvent(new Event('vehicleGateEntryPending-updated'))
    } catch { }
  }

  return (
    <>
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
            <label className="block text-sm font-medium text-slate-600 mb-2"><p>Vehicle Reg No. (Eg. {getVehicleByIndex(3)})</p></label>
            <div className="flex items-center gap-2 mb-3">
              <input value={inputValue} onChange={(e) => setInputValue(e.target.value.toUpperCase())} placeholder={`Enter vehicle reg no. e.g. ${getVehicleByIndex(4)}`} className="flex-1 text-sm px-2 py-1 border rounded-md" />
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
            <DocumentUploadZone onPreview={(url) => setModalSrc(url)} vehicleRegNo={vehicleRegNo} />
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
            <h3 className="font-medium text-slate-700 mb-3">RFID</h3>
            <RFIDModule onProceed={handleProceed} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {modalSrc && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="relative bg-white rounded-ui shadow-card max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <button
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white text-red-600 shadow border border-red-200 hover:bg-red-50"
              onClick={() => setModalSrc(null)}
              aria-label="Close document"
              title="Close"
            >
              ×
            </button>
            <div className="p-4 h-[85vh] overflow-auto">
              {modalSrc && (
                <DocumentRenderer
                  src={modalSrc}
                  filename={modalSrc.split('/').pop() || 'Document'}
                  onLoad={() => { setPreviewLoading(false); setPreviewError(null); }}
                  onError={(err) => { setPreviewLoading(false); setPreviewError(err); }}
                />
              )}
            </div>
          </div>
        </div>
      )}

    </>
  )
}
