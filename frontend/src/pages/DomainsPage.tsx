import { useEffect, useMemo, useState } from 'react'
import { Plus, Download } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { DomainTable } from '@/components/domains/DomainTable'
import { FilterBar, FilterValue } from '@/components/domains/FilterBar'
import { BulkActionsBar } from '@/components/domains/BulkActionsBar'
import { DomainFormModal } from '@/components/domains/DomainFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/ui/States'
import { api } from '@/lib/api'
import { Service, ServiceFormData } from '@/types'

export function DomainsPage() {
  const [services, setServices]       = useState<Service[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<FilterValue>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<Service | null>(null)
  const [formError, setFormError]       = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await api.get('/services')
      setServices(res.data)
      setError(null)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const filtered = useMemo(() => {
    let result = services
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(svc =>
        (svc.service_name     || '').toLowerCase().includes(s) ||
        (svc.entity_name      || '').toLowerCase().includes(s) ||
        (svc.service_provider || '').toLowerCase().includes(s) ||
        (svc.location         || '').toLowerCase().includes(s) ||
        (svc.account_details  || '').toLowerCase().includes(s) ||
        (svc.contact_details  || '').toLowerCase().includes(s)
      )
    }
    if (filter !== 'all') {
      result = result.filter(svc => svc.expiry_status === filter)
    }
    return result
  }, [services, search, filter])

  const counts = useMemo(() => ({
    all:           services.length,
    healthy:       services.filter(s => s.expiry_status === 'healthy').length,
    expiring_soon: services.filter(s => s.expiry_status === 'expiring_soon').length,
    expired:       services.filter(s => s.expiry_status === 'expired').length,
  }), [services])

  const handleFormSubmit = async (data: ServiceFormData) => {
    setSubmitting(true); setFormError(null)
    try {
      // Clean empty strings to null for optional fields
      const payload: any = { ...data }
      for (const k of Object.keys(payload)) {
        if (payload[k] === '') payload[k] = null
      }
      if (editTarget) {
        await api.put(`/services/${editTarget.id}`, payload)
      } else {
        await api.post('/services', payload)
      }
      setFormOpen(false)
      fetch()
    } catch (e: any) {
      setFormError(e.response?.data?.detail || 'Failed to save service')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await api.delete(`/services/${deleteTarget.id}`)
    fetch()
  }

  const handleBulkDelete = async () => {
    await api.post('/services/bulk-delete', { ids: selectedIds })
    setSelectedIds([])
    fetch()
  }

  const handleExport = async () => {
    const res = await api.get('/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.setAttribute('download', 'services_export.csv')
    document.body.appendChild(a); a.click(); a.remove()
  }

  return (
    <AppLayout onSearch={setSearch}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Services</h1>
          <p className="text-sm text-ink-500 mt-0.5">Manage all tracked services and expiry dates</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary"><Download size={15} />Export CSV</button>
          <button onClick={() => { setEditTarget(null); setFormError(null); setFormOpen(true) }} className="btn-primary">
            <Plus size={15} />Add Service
          </button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <FilterBar active={filter} onChange={setFilter} counts={counts} />
        <BulkActionsBar selectedCount={selectedIds.length}
          onClear={() => setSelectedIds([])} onBulkDelete={() => setBulkDeleteOpen(true)} />
      </div>

      {loading && <LoadingSpinner label="Loading services…" />}
      {error   && <ErrorState message={error} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title="No services found"
          description={search || filter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first service'}
          action={!search && filter === 'all' ? (
            <button onClick={() => { setEditTarget(null); setFormOpen(true) }} className="btn-primary">
              <Plus size={15} />Add Service
            </button>
          ) : undefined}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <DomainTable services={filtered} selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={s => { setEditTarget(s); setFormError(null); setFormOpen(true) }}
          onDelete={setDeleteTarget} />
      )}

      <DomainFormModal isOpen={formOpen} onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit} initialData={editTarget}
        isSubmitting={submitting} serverError={formError} />

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} title="Delete Service"
        message={`Delete "${deleteTarget?.entity_name} (${deleteTarget?.service_name})"? This cannot be undone.`}
        confirmLabel="Delete" />

      <ConfirmDialog isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete} title="Delete Selected Services"
        message={`Delete ${selectedIds.length} service(s)? This cannot be undone.`}
        confirmLabel="Delete All" />
    </AppLayout>
  )
}
