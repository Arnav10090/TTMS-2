export default function ProgressBar({ value, color = 'blue', showLabel = false }: { value: number; color?: 'blue'|'green'|'yellow'|'red'; showLabel?: boolean }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const colorCls = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }[color]
  const labelColor = clamped >= 60 ? 'text-white' : 'text-slate-700'
  return (
    <div className="progress-track relative" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped} aria-label="progress">
      <div className={`progress-fill ${colorCls}`} style={{ width: `${clamped}%` }} />
      {showLabel && (
        <div className={`absolute inset-0 flex items-center justify-center ${labelColor} text-[10px] font-medium select-none`}>{clamped}%</div>
      )}
    </div>
  )
}
