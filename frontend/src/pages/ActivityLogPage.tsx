import { useEffect, useState } from 'react'
import { History, Mail } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner, EmptyState } from '@/components/ui/States'
import { api } from '@/lib/api'
import { ActivityLogEntry, EmailLogEntry } from '@/types'

const ACTION_LABELS: Record<string, string> = {
  LOGIN:           'Login',
  CREATE_SERVICE:  'Service Created',
  UPDATE_SERVICE:  'Service Updated',
  DELETE_SERVICE:  'Service Deleted',
  BULK_DELETE:     'Bulk Delete',
  BULK_UPDATE:     'Bulk Update',
  CSV_IMPORT:      'CSV Import',
  CSV_EXPORT:      'CSV Export',
  SETTINGS_UPDATE: 'Settings Updated',
  EMAIL_SENT:      'Email Sent',
}

// Human-readable reminder label
const emailTypeLabel = (type: string, days: number) => {
  const map: Record<string, string> = {
    expiry_60d: '60-day reminder',
    expiry_30d: '30-day reminder',
    expiry_7d:  '7-day reminder',
    expiry_1d:  '1-day reminder',
  }
  return map[type] || `${days}d reminder`
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ActivityLogPage() {
  const [tab, setTab]           = useState<'activity' | 'email'>('activity')
  const [logs, setLogs]         = useState<ActivityLogEntry[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([api.get('/activity'), api.get('/email-logs')])
      .then(([a, e]) => { setLogs(a.data); setEmailLogs(e.data) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Activity Log</h1>
        <p className="text-sm text-ink-500 mt-0.5">Audit trail of all actions and reminder emails</p>
      </div>

      <div className="flex gap-2 mb-4">
        {([['activity', 'Activity', History], ['email', 'Email Logs', Mail]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {loading && <LoadingSpinner label="Loading logs…" />}

      {!loading && tab === 'activity' && (
        <div className="card">
          {logs.length === 0
            ? <EmptyState title="No activity recorded yet" />
            : (
              <div className="divide-y divide-ink-100">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-sm font-medium text-ink-900">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      {log.description && <p className="text-xs text-ink-500 mt-0.5">{log.description}</p>}
                    </div>
                    <span className="text-xs text-ink-400 font-mono whitespace-nowrap">{fmtDateTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {!loading && tab === 'email' && (
        <div className="card">
          {emailLogs.length === 0
            ? <EmptyState title="No reminder emails sent yet"
                description="Emails will appear here once the daily scheduler runs at 08:00" />
            : (
              <div className="divide-y divide-ink-100">
                {emailLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="text-sm font-medium text-ink-900">
                        {log.entity_name} <span className="text-ink-400 font-normal">({log.service_name})</span>
                      </span>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {emailTypeLabel(log.email_type, log.days_before)} · {log.status === 'sent' ? 'sent to' : 'failed for'} {log.recipient}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-status-danger mt-0.5">{log.error_message}</p>
                      )}
                    </div>
                    <span className={`text-xs font-mono whitespace-nowrap ${log.status === 'sent' ? 'text-status-healthy' : 'text-status-danger'}`}>
                        {fmtDateTime(log.sent_at)}
                      </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}
    </AppLayout>
  )
}
