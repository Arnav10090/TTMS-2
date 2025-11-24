"use client"

export interface PeriodFilterProps {
  startDate: Date | null
  endDate: Date | null
  onPeriodChange: (start: Date | null, end: Date | null) => void
}

export default function PeriodFilter({ startDate, endDate, onPeriodChange }: PeriodFilterProps) {
  const handleClearFromDate = () => {
    onPeriodChange(null, endDate);
  };

  const handleClearToDate = () => {
    onPeriodChange(startDate, null);
  };

  const ClearButton = ({ onClick, title }: { onClick: () => void; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
      title={title}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">From Date & Time</label>
        <div className="relative">
          <input
            type="datetime-local"
            value={startDate ? new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, -1) : ''}
            onChange={(e) => onPeriodChange(e.target.value ? new Date(e.target.value) : null, endDate)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
          />
          {startDate && (
            <ClearButton 
              onClick={handleClearFromDate} 
              title="Clear from date" 
            />
          )}
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">To Date & Time</label>
        <div className="relative">
          <input
            type="datetime-local"
            value={endDate ? new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000).toISOString().slice(0, -1) : ''}
            onChange={(e) => onPeriodChange(startDate, e.target.value ? new Date(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
          />
          {endDate && (
            <ClearButton 
              onClick={handleClearToDate} 
              title="Clear to date" 
            />
          )}
        </div>
      </div>
    </div>
  )
}
