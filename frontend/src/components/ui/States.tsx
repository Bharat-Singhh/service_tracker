import { Loader2, Inbox, AlertCircle } from 'lucide-react'

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 size={24} className="animate-spin text-ink-400" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  )
}

export function EmptyState({
  title = 'No data found',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
        <Inbox size={20} className="text-ink-400" />
      </div>
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description && <p className="text-sm text-ink-400 max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-dangerBg">
        <AlertCircle size={20} className="text-status-danger" />
      </div>
      <p className="text-sm font-medium text-ink-700">Something went wrong</p>
      <p className="text-sm text-ink-400 max-w-sm">{message}</p>
    </div>
  )
}
