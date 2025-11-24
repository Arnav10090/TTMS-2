"use client"

import { Calendar } from 'lucide-react'

export interface DayWiseFilterProps {
  selectedDate: Date | null
  onDateSelect: (date: Date | null) => void
}

export default function DayWiseFilter({ selectedDate, onDateSelect }: DayWiseFilterProps) {
  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="date"
        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
        onChange={(e) => onDateSelect(e.target.value ? new Date(e.target.value) : null)}
        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}
