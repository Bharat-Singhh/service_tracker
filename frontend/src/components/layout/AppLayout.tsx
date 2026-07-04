import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'

interface AppLayoutProps {
  children: ReactNode
  onSearch?: (value: string) => void
  searchPlaceholder?: string
}

export function AppLayout({ children, onSearch, searchPlaceholder }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar />
      <div className="ml-60 flex min-h-screen flex-col">
        <Navbar onSearch={onSearch} searchPlaceholder={searchPlaceholder} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
