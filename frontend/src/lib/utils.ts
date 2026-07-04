import type { ExpiryStatus } from '@/types'

export function statusLabel(status: ExpiryStatus): string {
  switch (status) {
    case 'healthy':       return 'Healthy'
    case 'expiring_soon': return 'Expiring Soon'
    case 'expired':       return 'Expired'
  }
}

export function statusBadgeClasses(status: ExpiryStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-status-healthyBg text-status-healthy border border-status-healthyBorder'
    case 'expiring_soon':
      return 'bg-status-warningBg text-status-warning border border-status-warningBorder'
    case 'expired':
      return 'bg-status-dangerBg text-status-danger border border-status-dangerBorder'
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function daysLabel(days: number): string {
  if (days < 0)  return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
