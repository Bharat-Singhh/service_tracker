import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  variant?: 'default' | 'warning' | 'danger'
}

const variantClasses = {
  default: { iconBg: 'bg-ink-100', iconColor: 'text-ink-600' },
  warning: { iconBg: 'bg-status-warningBg', iconColor: 'text-status-warning' },
  danger: { iconBg: 'bg-status-dangerBg', iconColor: 'text-status-danger' },
}

export function StatCard({ label, value, icon: Icon, variant = 'default' }: StatCardProps) {
  const { iconBg, iconColor } = variantClasses[variant]
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-500 font-medium">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
    </div>
  )
}
