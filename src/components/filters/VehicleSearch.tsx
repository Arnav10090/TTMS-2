"use client"

import { Search } from 'lucide-react'

export interface VehicleSearchProps {
  onSearch: (regNo: string) => void
  placeholder?: string
}

export default function VehicleSearch({ onSearch, placeholder = 'Search by Vehicle Registration...' }: VehicleSearchProps) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="pl-4 pr-10 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onChange={(e) => onSearch(e.target.value)}
      />
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
    </div>
  )
}
