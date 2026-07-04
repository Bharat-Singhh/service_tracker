import { ExpiryStatus } from '@/types'
import { statusLabel, statusBadgeClasses } from '@/lib/utils'

export function StatusBadge({ status }: { status: ExpiryStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(status)}`}>
      {statusLabel(status)}
    </span>
  )
}
