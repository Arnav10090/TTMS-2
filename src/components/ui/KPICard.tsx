import { ReactNode } from 'react'

interface KPICardProps {
  title: string
  primaryValue?: string | number
  secondaryMetrics: Array<{ label: string; value: ReactNode }>
  trend?: { direction: 'up' | 'down'; percentage: number }
  tone?: 'green' | 'yellow' | 'red' | 'blue'
  icon?: ReactNode
  footer?: ReactNode
  loading?: boolean
  rowVariant?: 'plain' | 'pill'
}

export default function KPICard({ title, primaryValue, secondaryMetrics, trend, tone = 'blue', icon, footer, loading, rowVariant = 'plain' }: KPICardProps) {
  const toneBorder = {
    green: 'border-l-4 border-green-500',
    yellow: 'border-l-4 border-yellow-500',
    red: 'border-l-4 border-red-500',
    blue: 'border-l-4 border-blue-500',
  }[tone]

  const accentBg = {
    green: 'from-emerald-400/10 to-emerald-500/10',
    yellow: 'from-amber-400/10 to-amber-500/10',
    red: 'from-rose-400/10 to-rose-500/10',
    blue: 'from-blue-400/10 to-blue-500/10',
  }[tone]

  const trendClasses = trend
    ? trend.direction === 'up'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200'
    : ''

  const trendText = trend
    ? `${trend.direction === 'down' ? '-' : trend.direction === 'up' ? '+' : ''}${(+trend.percentage).toFixed(1)}%`
    : ''

  return (
    <div className={`relative card ${toneBorder} p-2 hover:shadow-lg transition-shadow border border-slate-200/70 dark:border-slate-700/60 overflow-hidden`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${accentBg}`} />

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="grid place-content-center h-8 w-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {icon}
            </div>
          )}
          <p className="text-base font-bold text-slate-800 dark:text-white">{title}</p>
        </div>
        {trend && (
          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${trendClasses}`}>
            <span>{trend.direction === 'up' ? '↗' : '↘'}</span>
            <span>{trendText}</span>
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-7 bg-slate-100 rounded w-1/2 animate-pulse" />
      ) : primaryValue !== undefined && primaryValue !== '' ? (
        <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{primaryValue}</div>
      ) : null}

      <div className="mt-2 grid grid-cols-1 gap-1">
        {secondaryMetrics.map((m, i) => (
          <div
            key={i}
            className={
              rowVariant === 'pill'
                ? 'text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600'
                : 'text-sm text-slate-700 dark:text-slate-200 flex justify-between'
            }
          >
            <span className="truncate font-bold">{m.label}</span>
            <span className="font-semibold text-slate-900 dark:text-white">{m.value}</span>
          </div>
        ))}
      </div>

      {footer && <div className="mt-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/60">{footer}</div>}
    </div>
  )
}
