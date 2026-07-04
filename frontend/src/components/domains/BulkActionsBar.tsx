import { Trash2, X } from 'lucide-react'

interface BulkActionsBarProps {
  selectedCount: number
  onClear: () => void
  onBulkDelete: () => void
}

export function BulkActionsBar({ selectedCount, onClear, onBulkDelete }: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-ink-900 px-4 py-2.5 text-white">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{selectedCount} selected</span>
        <button onClick={onClear} className="text-ink-300 hover:text-white transition-colors">
          <X size={15} />
        </button>
      </div>
      <button
        onClick={onBulkDelete}
        className="flex items-center gap-1.5 rounded-md bg-status-danger px-3 py-1.5 text-sm font-medium hover:bg-red-700 transition-colors"
      >
        <Trash2 size={14} />
        Delete Selected
      </button>
    </div>
  )
}
