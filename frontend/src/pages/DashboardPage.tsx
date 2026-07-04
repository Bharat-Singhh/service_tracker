import { useEffect, useState } from 'react'
import { Globe, Clock, XCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { DomainList } from '@/components/dashboard/DomainList'
import { LoadingSpinner, ErrorState } from '@/components/ui/States'
import { api } from '@/lib/api'
import { DashboardStats } from '@/types'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-0.5">Overview of all tracked services</p>
      </div>

      {loading && <LoadingSpinner label="Loading dashboard…" />}
      {error   && <ErrorState message={error} />}

      {stats && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Services"  value={stats.total}         icon={Globe} />
            <StatCard label="Expiring Soon"   value={stats.expiring_soon} icon={Clock}  variant="warning" />
            <StatCard label="Expired"         value={stats.expired}       icon={XCircle} variant="danger" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <DomainList
              title="Expiring in Next 60 Days"
              services={stats.expiring_next_60}
              emptyLabel="No services expiring in the next 60 days  🎉"
            />
            <DomainList
              title="Recently Expired"
              services={stats.recently_expired}
              emptyLabel="No expired services"
            />
          </div>
        </>
      )}
    </AppLayout>
  )
}
