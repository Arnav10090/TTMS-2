export default function ProgressBar({ value, color = 'blue', showLabel = false }: { value: number; color?: 'blue'|'green'|'yellow'|'red'; showLabel?: boolean }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
  }
  const fillColor = colorMap[color]
  const labelColor = clamped >= 60 ? '#ffffff' : '#475569'

  return (
    <div
      className="relative"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label="progress"
      style={{
        width: '100%',
        height: '12px',
        backgroundColor: '#e2e8f0',
        borderRadius: '9999px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: '9999px',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: clamped > 0 ? '2px' : '0px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        }}
      />
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: labelColor,
            fontSize: '10px',
            fontWeight: 500,
            userSelect: 'none',
          }}
        >
          {clamped}%
        </div>
      )}
    </div>
  )
}
