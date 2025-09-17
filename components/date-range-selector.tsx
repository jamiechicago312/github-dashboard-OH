'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { TimeRangeOption } from '@/types/github'

interface DateRangeSelectorProps {
  selectedRange: TimeRangeOption
  onRangeChange: (range: TimeRangeOption) => void
  ranges: TimeRangeOption[]
  className?: string
}

export default function DateRangeSelector({
  selectedRange,
  onRangeChange,
  ranges,
  className = ''
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <CalendarIcon className="w-4 h-4" />
        <span>{selectedRange.label}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1">
            {ranges.map((range) => (
              <button
                key={range.value}
                onClick={() => {
                  onRangeChange(range)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  selectedRange.value === range.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}