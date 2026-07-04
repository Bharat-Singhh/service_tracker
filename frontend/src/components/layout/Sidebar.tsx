import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Layers, Upload, Settings, History, ShieldCheck } from 'lucide-react'

const NAV = [
  { to: '/',        label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/domains', label: 'Services',    icon: Layers },
  { to: '/import',  label: 'Import CSV',  icon: Upload },
  { to: '/settings',label: 'Settings',   icon: Settings },
  { to: '/activity',label: 'Activity Log',icon: History },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-60 border-r border-ink-200 bg-white flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-ink-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
          <ShieldCheck size={16} className="text-white" />
        </div>
        <span className="font-semibold text-ink-900 text-[15px]">Service Tracker</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              }`
            }>
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-ink-100">
        <p className="text-xs text-ink-400">Service Tracker v2.0</p>
      </div>
    </aside>
  )
}
