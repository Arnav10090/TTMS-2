"use client"

interface Tab {
  label: string
  tone: 'red'|'orange'|'gray'
}

const styles: Record<Tab['tone'], { bg: string; border: string; text: string }> = {
  red: { bg: 'bg-[#fef2f2]', border: 'border-[#dc2626]', text: 'text-[#dc2626]' },
  orange: { bg: 'bg-[#fff7ed]', border: 'border-[#ea580c]', text: 'text-[#ea580c]' },
  gray: { bg: 'bg-[#f9fafb]', border: 'border-[#6b7280]', text: 'text-[#6b7280]' },
}

export default function Tabs() {
  const tabs: Tab[] = [
    { label: 'PO Confirmation Vehicle Papers', tone: 'red' },
    { label: 'Parking Position Gate No', tone: 'orange' },
    { label: 'Order List', tone: 'gray' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t, i) => (
        <button
          key={`${t.label}-${i}`}
          className={`rounded-[6px] px-4 py-3 border ${styles[t.tone].bg} ${styles[t.tone].border} ${styles[t.tone].text} text-[14px] font-semibold hover:shadow`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
