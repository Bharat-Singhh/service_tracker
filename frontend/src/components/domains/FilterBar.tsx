type FilterValue = 'all' | 'healthy' | 'expiring_soon' | 'expired'

interface FilterBarProps {
  active:   FilterValue
  onChange: (f: FilterValue) => void
  counts:   Record<FilterValue, number>
}

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',           label: 'All' },
  { value: 'healthy',       label: 'Healthy' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
  { value: 'expired',       label: 'Expired' },
]

export function FilterBar({ active, onChange, counts }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            active === f.value
              ? 'bg-ink-900 text-white'
              : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
          }`}>
          {f.label}
          <span className={`text-xs ${active === f.value ? 'text-ink-300' : 'text-ink-400'}`}>
            {counts[f.value]}
          </span>
        </button>
      ))}
    </div>
  )
}

export type { FilterValue }
