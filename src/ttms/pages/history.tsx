import { useEffect, useMemo, useState } from 'react'
import { dashboardService } from '@/services/dashboardService'
import { VehicleRow } from '@/types/vehicle'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

export default function TTMSHistoryPage() {
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
  const [pageSize, setPageSize] = useState(10)

  const DRIVER_ALL = 'all-drivers'
  const CUSTOMER_ALL = 'all-customers'

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

  useEffect(() => {
    setDriverFilter(DRIVER_ALL)
    setCustomerFilter(CUSTOMER_ALL)
  }, [])

  const drivers = useMemo(() => Array.from(new Set(rows.map((r) => r.driverName))), [rows])
  const customers = useMemo(() => Array.from(new Set(rows.map((r) => r.customer))), [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (query && !(`${r.regNo}`.toLowerCase().includes(query.toLowerCase()) || `${r.driverName}`.toLowerCase().includes(query.toLowerCase()) || `${r.customer}`.toLowerCase().includes(query.toLowerCase()))) return false
      if (driverFilter && driverFilter !== DRIVER_ALL && r.driverName !== driverFilter) return false
      if (customerFilter && customerFilter !== CUSTOMER_ALL && r.customer !== customerFilter) return false
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
  }, [rows, query, driverFilter, customerFilter, start, end, DRIVER_ALL, CUSTOMER_ALL])

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

  useEffect(() => { setPage(1) }, [query, driverFilter, customerFilter, start, end, sortKey, sortDir, pageSize])

  const changeSort = (key: string) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <DashboardLayout>
      <div className="">
      <h2 className="text-2xl font-semibold text-slate-800 mb-3">Historical Data</h2>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Search</label>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Reg, driver, customer..." className="w-full px-3 py-2 border border-border rounded-md hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Driver</label>
            <Select value={driverFilter} onValueChange={setDriverFilter}>
              <SelectTrigger className="border-border hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200">
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 shadow-lg">
                <SelectItem value={DRIVER_ALL} className="hover:bg-primary/10 cursor-pointer">All Drivers</SelectItem>
                {drivers.map((d)=> <SelectItem key={d} value={d} className="hover:bg-primary/10 cursor-pointer">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Customer</label>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="border-border hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 shadow-lg">
                <SelectItem value={CUSTOMER_ALL} className="hover:bg-primary/10 cursor-pointer">All Customers</SelectItem>
                {customers.map((c)=> <SelectItem key={c} value={c} className="hover:bg-primary/10 cursor-pointer">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-muted-foreground mb-2">From</label>
              <input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md hover:border-primary/50 focus:border-primary transition-colors" />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-muted-foreground mb-2">To</label>
              <input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md hover:border-primary/50 focus:border-primary transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[900px]">
          <thead className="bg-muted/20 border-b border-border/40">
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
                { key: 'totalDwellTime', label: 'Total Dwell (min)' },
                { key: 'timestamp', label: 'Reporting time' },
                { key: 'remarks', label: 'Remarks' },
              ].map((col) => (
                <th key={col.key} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground border border-border/40">
                  <button onClick={()=>changeSort(col.key)} className="flex items-center justify-center gap-2">
                    <span>{col.label}</span>
                    {sortKey === col.key && <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={18} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : pageData.length === 0 ? (
              <tr><td colSpan={18} className="p-6 text-center text-muted-foreground">No records</td></tr>
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
              <tr key={r.sn} className="border-b border-border/30 hover:bg-primary/8 hover:shadow-sm transition-all duration-150 cursor-pointer">
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{r.sn}</td>
                <td className="px-3 py-2 text-center border border-border/30"><div className="flex items-center justify-center gap-2"><Truck className="w-4 h-4 text-muted-foreground"/><div className="font-medium">{r.regNo}</div></div></td>
                <td className="px-3 py-2 text-sm text-center border border-border/30">{r.rfidNo ?? '-'}</td>
                <td className="px-3 py-2 text-sm text-center border border-border/30">{r.driverName}</td>
                <td className="px-3 py-2 text-sm text-center border border-border/30">{r.driverPhone}</td>
                <td className="px-3 py-2 text-sm text-center border border-border/30">{r.customer}</td>
                <td className="px-3 py-2 text-sm text-center border border-border/30">{r.customerRef}</td>

                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{times['gateEntry']}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{times['tareWeighing']}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{times['loading']}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{times['postLoadingWeighing']}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{times['gateExit']}</td>

                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{r.tareWt}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{r.wtAfter}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{calculatedTTR}</td>
                <td className="px-3 py-2 text-sm font-mono text-center border border-border/30">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-center border border-border/30">{r.remarks}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground">Showing {sorted.length === 0 ? 0 : Math.min(sorted.length, (page-1)*pageSize+1)} to {Math.min(sorted.length, page*pageSize)} of {sorted.length} entries</div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Rows per page</label>
            <Select value={String(pageSize)} onValueChange={(val)=>setPageSize(parseInt(val))}>
              <SelectTrigger className="border-border hover:border-primary hover:bg-primary/5 hover:shadow-md focus:border-primary focus:shadow-lg transition-all duration-200 w-[140px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 shadow-lg">
                <SelectItem value="10" className="hover:bg-primary/10 cursor-pointer">10</SelectItem>
                <SelectItem value="25" className="hover:bg-primary/10 cursor-pointer">25</SelectItem>
                <SelectItem value="50" className="hover:bg-primary/10 cursor-pointer">50</SelectItem>
                <SelectItem value="100" className="hover:bg-primary/10 cursor-pointer">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={()=>setPage(1)} disabled={page === 1} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
          <button onClick={()=>setPage((p)=>Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">« Prev</button>
          {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded text-sm ${page === i + 1 ? 'bg-cyan-500 text-white border border-cyan-500' : 'border border-slate-300 hover:bg-slate-50'}`}>{i + 1}</button>
          ))}
          <button onClick={()=>setPage((p)=>Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next »</button>
          <button onClick={()=>setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
        </div>
      </div>
      </div>
    </DashboardLayout>
  )
}
