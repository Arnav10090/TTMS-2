"use client"

import { useState, useEffect } from 'react'
import { VehicleRow } from '@/types/vehicle'

function formatTime(minutes: number): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + minutes)
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

export default function VehicleQueueTable({
  vehicles,
  onVerifyDocs,
  actionButton
}: {
  vehicles: VehicleRow[]
  onVerifyDocs: (regNo: string) => void
  actionButton?: React.ReactNode
}) {
  const topTen = vehicles.slice(0, 10)
  // Store persistent remarks
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  // Store items currently being edited (true = show input)
  const [editing, setEditing] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vehicleRemarks')
      if (stored) {
        setRemarks(JSON.parse(stored))
      }
    } catch { }
  }, [])

  const handleRemarkChange = (regNo: string, val: string) => {
    setRemarks(prev => ({ ...prev, [regNo]: val }))
  }

  const saveRemark = (regNo: string) => {
    try {
      const stored = localStorage.getItem('vehicleRemarks')
      const parsed = stored ? JSON.parse(stored) : {}
      parsed[regNo] = remarks[regNo] || ''
      localStorage.setItem('vehicleRemarks', JSON.stringify(parsed))
      // Switch off edit mode
      setEditing(prev => ({ ...prev, [regNo]: false }))
    } catch { }
  }

  const enableEdit = (regNo: string) => {
    setEditing(prev => ({ ...prev, [regNo]: true }))
  }

  const deleteRemark = (regNo: string) => {
    if (confirm('Are you sure you want to delete this remark?')) {
      const next = { ...remarks }
      delete next[regNo]
      setRemarks(next)
      setEditing(prev => ({ ...prev, [regNo]: true })) // Revert to input mode (empty)

      try {
        const stored = localStorage.getItem('vehicleRemarks')
        const parsed = stored ? JSON.parse(stored) : {}
        delete parsed[regNo]
        localStorage.setItem('vehicleRemarks', JSON.stringify(parsed))
      } catch { }
    }
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-slate-800 font-semibold text-lg">
          Vehicle Queue
        </h3>
        {actionButton && <div>{actionButton}</div>}
      </div>

      <div className="overflow-x-auto border border-[#e5e7eb] rounded-ui">
        <table className="min-w-full text-base">
          <thead className="bg-[#f3f4f6] text-lg font-semibold text-slate-700">
            <tr>
              <th className="px-3 py-2 text-center w-[80px]">SNo.</th>
              <th className="px-3 py-2 text-center w-[160px]">Vehicle Reg No.</th>
              <th className="px-3 py-2 text-center w-[140px]">Reporting Time</th>
              <th className="px-3 py-2 text-center flex-1">Remarks</th>
              <th className="px-3 py-2 text-center w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topTen.map((vehicle, index) => {
              const reportingMinutes = index * 5
              const reportingTime = formatTime(reportingMinutes)
              const savedValue = remarks[vehicle.regNo]
              const isEditing = editing[vehicle.regNo] ?? (!savedValue) // Default to edit if no value

              return (
                <tr
                  key={vehicle.sn}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'} border-t border-[#e5e7eb] hover:bg-blue-50`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 text-center">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 text-center">{vehicle.regNo}</td>
                  <td className="px-3 py-2 text-gray-700 text-center">{reportingTime}</td>
                  <td className="px-3 py-2 text-gray-700 text-center align-middle">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={savedValue || ''}
                          onChange={(e) => handleRemarkChange(vehicle.regNo, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter remarks"
                        />
                        <button
                          onClick={() => saveRemark(vehicle.regNo)}
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-medium flex-shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full px-2 min-h-[32px] gap-2">
                        <span className="text-sm text-gray-800 text-left flex-grow break-all">
                          {savedValue}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => enableEdit(vehicle.regNo)}
                            className="px-2 py-1 rounded text-blue-600 hover:bg-blue-50 text-sm font-medium border border-transparent hover:border-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRemark(vehicle.regNo)}
                            className="px-2 py-1 rounded text-red-600 hover:bg-red-50 text-sm font-medium border border-transparent hover:border-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onVerifyDocs(vehicle.regNo)}
                      className="px-3 py-1.5 rounded-ui bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Verify Docs
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {topTen.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No vehicles in queue
          </div>
        )}
      </div>
    </div>
  )
}
