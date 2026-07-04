import { useState } from 'react'
import { Search, LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
  onSearch?: (value: string) => void
  searchPlaceholder?: string
}

export function Navbar({ onSearch, searchPlaceholder = 'Search domains, platform, notes...' }: NavbarProps) {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink-200 bg-white px-6 py-3">
      <div className="relative flex-1 max-w-md">
        {onSearch && (
          <>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/10 focus:border-ink-400 focus:bg-white transition-colors"
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100">
            <User size={14} className="text-ink-500" />
          </div>
          <span className="font-medium text-ink-700">{username}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  )
}
