"use client"

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
              
              return (
                <tr
                  key={vehicle.sn}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'} border-t border-[#e5e7eb] hover:bg-blue-50`}
                >
                  <td className="px-3 py-2 font-medium text-gray-900 text-center">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 text-center">{vehicle.regNo}</td>
                  <td className="px-3 py-2 text-gray-700 text-center">{reportingTime}</td>
                  <td className="px-3 py-2 text-gray-700 text-center">
                    {vehicle.progress < 30 ? 'Pending' : vehicle.progress < 70 ? 'In Progress' : 'Ready for Verification'}
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
