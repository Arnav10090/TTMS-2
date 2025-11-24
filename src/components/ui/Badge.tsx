import { ReactNode } from 'react'

export default function Badge({ children, tone = 'info' }: { children: ReactNode; tone?: 'success'|'warning'|'danger'|'info' }) {
  const cls = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-info'
  }[tone]
  return <span className={cls}>{children}</span>
}
