export default function InfoPanel() {
  return (
    <div className="card p-4">
      <h3 className="text-slate-800 font-semibold mb-2">Information</h3>
      <ul className="text-sm text-slate-700 space-y-1">
        <li>
          <span className="font-medium">Note:</span> Vehicle with max TTR to be highlighted
        </li>
        <li>
          <span className="font-medium">Sub-note:</span> All vehicles with TTR &gt; defined TTR to be highlighted in tabular form on Dashboard
        </li>
        <li>
          <span className="font-medium">Alerts:</span> 1) For higher waiting time 2) Higher TTR
        </li>
      </ul>
    </div>
  )
}
