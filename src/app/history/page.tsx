import { useEffect, useMemo, useState } from 'react'
import { dashboardService } from '@/services/dashboardService'
import { VehicleRow } from '@/types/vehicle'
import { Truck } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'

function enhanceRows(rows: VehicleRow[]) {
  return rows.map((r) => {
    const stageValues = Object.values(r.stages)
    const totalVariance = stageValues.reduce((sum, stage) => {
      const variance = (stage.waitTime ?? 0) - (stage.stdTime ?? 0)
      return sum + Math.max(0, variance)
    }, 0)
    const remarks = totalVariance >= 60
      ? 'Investigate prolonged delays'
      : totalVariance > 20
        ? 'Monitor minor delays'
        : 'On schedule'

    return {
      ...r,
      driverName: `Driver ${r.sn}`,
      driverPhone: `+91 90000${String(r.sn).padStart(3, '0')}`,
      customer: `Customer ${((r.sn % 5) + 1)}`,
      customerRef: `CUST-${1000 + r.sn}`,
      remarks,
    }
  })
}

export default function HistoryPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [start, setStart] = useState<string>('')
  const [end, setEnd] = useState<string>('')
  const [sortKey, setSortKey] = useState<string>('timestamp')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 12

  useEffect(() => {
    let mounted = true
    setLoading(true)
    dashboardService.getVehicleRows().then((data) => {
      if (!mounted) return
      setRows(enhanceRows(data))
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const drivers = useMemo(() => Array.from(new Set(rows.map((r) => r.driverName))), [rows])
  const customers = useMemo(() => Array.from(new Set(rows.map((r) => r.customer))), [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (query && !(`${r.regNo}`.toLowerCase().includes(query.toLowerCase()) || `${r.driverName}`.toLowerCase().includes(query.toLowerCase()) || `${r.customer}`.toLowerCase().includes(query.toLowerCase()))) return false
      if (driverFilter && r.driverName !== driverFilter) return false
      if (customerFilter && r.customer !== customerFilter) return false
      if (start) {
        const s = new Date(start).getTime()
        if (new Date(r.timestamp).getTime() < s) return false
      }
      if (end) {
        const e = new Date(end).getTime()
        if (new Date(r.timestamp).getTime() > e) return false
      }
      return true
    })
  }, [rows, query, driverFilter, customerFilter, start, end])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey]
      const bv = (b as any)[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return sortDir === 'asc' ? -1 : 1
      if (bv == null) return sortDir === 'asc' ? 1 : -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [query, driverFilter, customerFilter, start, end, sortKey, sortDir])

  const changeSort = (key: string) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <DashboardLayout>
      <div className="">
      <h2 className="text-2xl font-semibold text-slate-800 mb-3">Historical Data</h2>

      <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Search</label>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Reg, driver, customer..." className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Driver</label>
            <select value={driverFilter} onChange={(e)=>setDriverFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm focus:border-blue-500 focus:shadow-lg transition-all duration-200">
              <option value="">All Drivers</option>
              {drivers.map((d)=> <option key={d} value={d} className="hover:bg-blue-100">{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Customer</label>
            <select value={customerFilter} onChange={(e)=>setCustomerFilter(e.target.value)} className="w-full px-3 py-2 border rounded-md hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm focus:border-blue-500 focus:shadow-lg transition-all duration-200">
              <option value="">All Customers</option>
              {customers.map((c)=> <option key={c} value={c} className="hover:bg-blue-100">{c}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-slate-600 mb-1">From</label>
              <input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-slate-600 mb-1">To</label>
              <input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {[
                { key: 'sn', label: 'SN' },
                { key: 'regNo', label: 'Vehicle Reg No' },
                { key: 'rfidNo', label: 'RFID No.' },
                { key: 'driverName', label: 'Driver' },
                { key: 'driverPhone', label: 'Phone' },
                { key: 'customer', label: 'Customer' },
                { key: 'customerRef', label: 'Customer Ref' },
                { key: 'gateEntry', label: 'Gate Entry' },
                { key: 'tareWeighing', label: 'Tare Weighing' },
                { key: 'loading', label: 'Loading' },
                { key: 'postLoadingWeighing', label: 'Post Load Weigh' },
                { key: 'gateExit', label: 'Gate Exit' },
                { key: 'tareWt', label: 'Tare Wt' },
                { key: 'wtAfter', label: 'Wt After' },
                { key: 'ttr', label: 'TTR (min)' },
                { key: 'timestamp', label: 'Timestamp' },
                { key: 'remarks', label: 'Remarks' },
              ].map((col) => (
                <th key={col.key} className="px-3 py-3 text-center text-xs text-slate-600">
                  <button onClick={()=>changeSort(col.key)} className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {sortKey === col.key && <span className="text-xxs text-slate-400">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={17} className="p-6 text-center text-slate-500">Loading...</td></tr>
            ) : pageData.length === 0 ? (
              <tr><td colSpan={17} className="p-6 text-center text-slate-500">No records</td></tr>
            ) : pageData.map((r) => {
              const times = (() => {
                const order = ['gateEntry','tareWeighing','loading','postLoadingWeighing','gateExit'] as const
                let current = new Date(r.timestamp)
                const out: Record<string,string> = {}
                for (const key of order) {
                  const st = r.stages[key]
                  const addMin = Math.max(0, Math.round(st.state === 'completed' ? st.waitTime : st.stdTime))
                  current = new Date(current.getTime() + addMin * 60_000)
                  out[key] = `${String(current.getHours()).padStart(2,'0')}:${String(current.getMinutes()).padStart(2,'0')}`
                }
                return out
              })()

              const calculatedTTR = (() => {
                const order = ['gateEntry','tareWeighing','loading','postLoadingWeighing','gateExit'] as const
                return order.reduce((total, stage) => {
                  const stageState = r.stages[stage]
                  if (stageState.state === 'completed') return total + Math.max(0, stageState.waitTime)
                  return total
                }, 0)
              })()

              return (
              <tr key={r.sn} className="border-b last:border-b-0 hover:bg-blue-50 hover:shadow-sm transition-all duration-150 cursor-pointer">
                <td className="px-3 py-2 text-sm text-slate-700 text-center">{r.sn}</td>
                <td className="px-3 py-2 text-center"><div className="flex items-center justify-center gap-2"><Truck className="w-4 h-4 text-slate-400"/><div className="font-medium">{r.regNo}</div></div></td>
                <td className="px-3 py-2 text-sm text-center">{r.rfidNo ?? '-'}</td>
                <td className="px-3 py-2 text-sm text-center">{r.driverName}</td>
                <td className="px-3 py-2 text-sm text-center">{r.driverPhone}</td>
                <td className="px-3 py-2 text-sm text-center">{r.customer}</td>
                <td className="px-3 py-2 text-sm text-center">{r.customerRef}</td>

                <td className="px-3 py-2 text-sm text-center">{times['gateEntry']}</td>
                <td className="px-3 py-2 text-sm text-center">{times['tareWeighing']}</td>
                <td className="px-3 py-2 text-sm text-center">{times['loading']}</td>
                <td className="px-3 py-2 text-sm text-center">{times['postLoadingWeighing']}</td>
                <td className="px-3 py-2 text-sm text-center">{times['gateExit']}</td>

                <td className="px-3 py-2 text-sm text-center">{r.tareWt}</td>
                <td className="px-3 py-2 text-sm text-center">{r.wtAfter}</td>
                <td className="px-3 py-2 text-sm text-center">{calculatedTTR}</td>
                <td className="px-3 py-2 text-sm text-center">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-center">{r.remarks}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-slate-600">Showing {Math.min(sorted.length, (page-1)*pageSize+1)} to {Math.min(sorted.length, page*pageSize)} of {sorted.length} entries</div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setPage((p)=>Math.max(1, p-1))} className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Previous</button>
          <div className="px-3 py-1 text-sm">Page {page} / {totalPages}</div>
          <button onClick={()=>setPage((p)=>Math.min(totalPages, p+1))} className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200">Next</button>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
