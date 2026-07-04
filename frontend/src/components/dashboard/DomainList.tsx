import { Service } from '@/types'
import { formatDate, daysLabel } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface DomainListProps {
  title:      string
  services:   Service[]
  emptyLabel: string
}

export function DomainList({ title, services, emptyLabel }: DomainListProps) {
  return (
    <div className="card">
      <div className="border-b border-ink-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      </div>
      <div className="divide-y divide-ink-100">
        {services.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-400">{emptyLabel}</p>
        ) : (
          services.map(s => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900 truncate">{s.entity_name}</p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {s.service_name}
                  {s.service_provider ? ` · ${s.service_provider}` : ''}
                  {' · '}
                  {formatDate(s.expiry_date)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className="text-xs text-ink-500 font-mono">{daysLabel(s.days_remaining)}</span>
                <StatusBadge status={s.expiry_status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
