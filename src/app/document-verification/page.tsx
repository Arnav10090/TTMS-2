"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import DocumentUploadZone from '@/components/document/DocumentUploadZone'
import SearchableOrderList from '@/components/document/SearchableOrderList'
import RFIDModule from '@/components/document/RFIDModule'
import DriverHelperDetails from '@/components/document/DriverHelperDetails'
import { DocumentPreviewModal } from '@/components/document/DocumentPreviewModal'
import { useState, useEffect } from 'react'
import { rfidAssignmentService } from '@/utils/rfidAssignments'


export default function DocumentVerificationPage() {
  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const [modalFilename, setModalFilename] = useState<string>('')
  const [vehicleRegNo, setVehicleRegNo] = useState<string>('')
  const [inputValue, setInputValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [driverValid, setDriverValid] = useState(false)
  const [helperValid, setHelperValid] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('selectedVehicleRegNo')
      if (saved) {
        setVehicleRegNo(saved)
        setInputValue(saved)
      }
    } catch { }
  }, [])

  const normalizeRegNo = (r: string) => r.replace(/\s|-/g, '').toUpperCase()

  const handleDocumentOpen = (url: string, filename?: string) => {
    setModalSrc(url);
    setModalFilename(filename || url.split('/').pop() || 'Unknown document');
  };

  const validateAndSet = () => {
    const v = inputValue.trim().toUpperCase()
    // Pattern to accept:
    // 1. MH12-1001 (Existing format)
    // 2. MH12AB4829 (Standard format without spaces/dashes)
    // 3. MH12 AB 4829 (Standard format with spaces)
    const pattern = /^([A-Z]{2}\d{2}-\d{4}|[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}|[A-Z]{2}\d{2}\s[A-Z]{1,2}\s\d{4})$/

    if (!pattern.test(v.replace(/\s/g, (m, offset, str) => str[offset] === '-' ? '-' : ''))) {
      // Simplified check: remove spaces (but keep dash if it's the specific format) to validate
      // Actually let's just make the regex more flexible for the input
    }

    // Simpler regex for "MH12AB4829" or "MH12-1001"
    // Let's allow: 
    // - Two letters
    // - Two digits
    // - Optional: One or two letters OR a dash
    // - Four digits
    const flexiblePattern = /^[A-Z]{2}\d{2}(?:[A-Z]{1,2}|-)\d{4}$/

    if (!flexiblePattern.test(v.replace(/\s/g, ''))) {
      setError('Invalid format. Expected format: MH12-1001 or MH12AB4829')
      return
    }

    setError(null)
    const norm = normalizeRegNo(v)
    setVehicleRegNo(norm)
    // Persist to localStorage (normalized)
    try {
      localStorage.setItem('selectedVehicleRegNo', norm)
    } catch { }
  }

  const handleClear = () => {
    setInputValue('')
    setVehicleRegNo('')
    setError(null)
    // Clear from localStorage
    try {
      localStorage.removeItem('selectedVehicleRegNo')
    } catch { }
  }

  const handleValidity = (v: { driver: boolean; helper: boolean }) => {
    if (typeof v.driver === 'boolean') setDriverValid(v.driver)
    if (typeof v.helper === 'boolean') setHelperValid(v.helper)
  }

  const handleProceed = (trackingNo: string) => {
    console.log('handleProceed called with:', { vehicleRegNo, trackingNo });
    if (vehicleRegNo && trackingNo) {
      rfidAssignmentService.saveAssignment(vehicleRegNo, trackingNo);
      console.log('RFID saved to localStorage');

      // Verify it was actually saved
      const saved = localStorage.getItem('vehicleRfidAssignments');
      console.log('localStorage direct check:', saved);
      const parsed = saved ? JSON.parse(saved) : {};
      console.log('Parsed assignments:', parsed);

      alert(`RFID ${trackingNo} has been assigned to vehicle ${vehicleRegNo}`);
    } else {
      console.warn('Missing vehicleRegNo or trackingNo:', { vehicleRegNo, trackingNo });
    }
  }


  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className="xl:col-span-1 space-y-4">
          <div className="card p-4">
            <label className="block text-sm font-medium text-slate-600 mb-2"><p>Vehicle Reg No. (Eg. MH12-1001)</p></label>
            <div className="flex items-center gap-2 mb-3">
              <input value={inputValue} onChange={(e) => setInputValue(e.target.value.toUpperCase())} placeholder="Enter vehicle reg no. e.g. MH12-1001" className="flex-1 text-sm px-2 py-1 border rounded-md" />
              <button onClick={validateAndSet} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">Enter</button>
              <button onClick={handleClear} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-sm">Clear</button>
            </div>
            {error && <div role="alert" aria-live="assertive" className="text-sm text-red-600 mb-2">{error}</div>}
            <h3 className="font-medium text-slate-700 mb-3">Upload Documents</h3>
            <DocumentUploadZone onPreview={(url, filename) => handleDocumentOpen(url, filename)} vehicleRegNo={vehicleRegNo} />
          </div>
          <div className="card p-4">
            <h3 className="font-medium text-slate-700 mb-3">Driver and Helper Details</h3>
            <DriverHelperDetails vehicleRegNo={vehicleRegNo} onValidationChange={handleValidity} />
          </div>
        </div>
        <div className="card p-4 xl:col-span-1 flex flex-col min-h-[600px]">
          <h3 className="font-medium text-slate-700 mb-3">Documents Uploaded by Customer</h3>
          <SearchableOrderList vehicleRegNo={vehicleRegNo} onOpen={handleDocumentOpen} />
        </div>
        <div className="card p-4 xl:col-span-1">
          <h3 className="font-medium text-slate-700 mb-3">RFID / Tracking Module</h3>
          <RFIDModule extraReady={driverValid && helperValid} onProceed={handleProceed} />
        </div>
      </div>

      <DocumentPreviewModal
        src={modalSrc}
        onClose={() => setModalSrc(null)}
        filename={modalFilename}
      />

    </DashboardLayout>
  )
}
