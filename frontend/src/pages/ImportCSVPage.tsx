import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { api } from '@/lib/api'
import { CSVPreviewRow, CSVImportResult } from '@/types'

type Step = 'upload' | 'preview' | 'result'

export function ImportCSVPage() {
  const [step, setStep]                   = useState<Step>('upload')
  const [file, setFile]                   = useState<File | null>(null)
  const [preview, setPreview]             = useState<CSVPreviewRow[]>([])
  const [duplicateAction, setDuplicateAction] = useState<'update' | 'skip'>('skip')
  const [result, setResult]               = useState<CSVImportResult | null>(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const fileInputRef                      = useRef<HTMLInputElement>(null)

  const duplicateCount = preview.filter(r => r.is_duplicate).length
  const invalidCount   = preview.filter(r => !r.is_valid).length
  const validCount     = preview.length - invalidCount

  const handleFileSelect = async (f: File) => {
    setFile(f); setError(null); setLoading(true)
    try {
      const fd = new FormData(); fd.append('file', f)
      const res = await api.post('/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPreview(res.data); setStep('preview')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to parse CSV')
    } finally { setLoading(false) }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('on_duplicate', duplicateAction)
      const res = await api.post('/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data); setStep('result')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Import failed')
    } finally { setLoading(false) }
  }

  const reset = () => {
    setFile(null); setPreview([]); setResult(null); setStep('upload'); setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Import CSV</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          Bulk-import services. Required columns: <code className="bg-ink-100 px-1 rounded text-xs">Service Name</code>,{' '}
          <code className="bg-ink-100 px-1 rounded text-xs">Entity Name</code>,{' '}
          <code className="bg-ink-100 px-1 rounded text-xs">Expiration Date</code>
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-status-dangerBg border border-status-dangerBorder px-4 py-3 text-sm text-status-danger">
          {error}
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="card p-8 space-y-6">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-ink-200 py-14 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
              <Upload size={22} className="text-ink-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-700">{loading ? 'Parsing…' : 'Drag & drop your CSV here'}</p>
              <p className="text-xs text-ink-400 mt-1">or click to browse</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            <button type="button" disabled={loading}
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="btn-secondary"><FileText size={15} />Choose File</button>
          </div>

          {/* Column reference */}
          <div className="rounded-lg bg-ink-50 border border-ink-100 p-4">
            <p className="text-xs font-semibold text-ink-600 mb-3">CSV Column Reference</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-ink-200">
                    <th className="text-left pb-2 pr-4 font-semibold text-ink-500">Column</th>
                    <th className="text-left pb-2 pr-4 font-semibold text-ink-500">Required</th>
                    <th className="text-left pb-2 font-semibold text-ink-500">Example</th>
                  </tr>
                </thead>
                <tbody className="text-ink-600 divide-y divide-ink-100">
                  {[
                    ['Service Name',     '✅', 'Domain, SSL, NDA, Licence'],
                    ['Entity Name',      '✅', 'example.com, Vendor ABC'],
                    ['Expiration Date',  '✅', '2026-12-31'],
                    ['Location',         '—',  'US-East, Mumbai'],
                    ['Start Date',       '—',  '2024-01-01'],
                    ['Status',           '—',  'Active, Pending'],
                    ['Service Provider', '—',  'Cloudflare, GoDaddy'],
                    ['Account Details',  '—',  'Account ID / login info'],
                    ['Contact Details',  '—',  'John Doe, +91-9999999999'],
                    ['NDA Status',       '—',  'Signed, N/A'],
                    ['NDA Expire Date',  '—',  '2027-06-30'],
                    ['Cost',             '—',  '1200.00'],
                  ].map(([col, req, ex]) => (
                    <tr key={col}>
                      <td className="py-1.5 pr-4 font-medium text-ink-700">{col}</td>
                      <td className="py-1.5 pr-4">{req}</td>
                      <td className="py-1.5 text-ink-400">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-ink-400 mt-3">
              Date formats accepted: YYYY-MM-DD · DD/MM/YYYY · MM/DD/YYYY · DD-MM-YYYY
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Rows',  value: preview.length, color: 'text-ink-900' },
              { label: 'Valid',       value: validCount,      color: 'text-status-healthy' },
              { label: 'Duplicates', value: duplicateCount,   color: 'text-status-warning' },
              { label: 'Invalid',    value: invalidCount,     color: 'text-status-danger' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <p className="text-xs text-ink-500 font-medium">{s.label}</p>
                <p className={`text-xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {duplicateCount > 0 && (
            <div className="card p-4">
              <p className="text-sm font-medium text-ink-700 mb-3">
                {duplicateCount} duplicate(s) found — how should they be handled?
              </p>
              <div className="flex gap-4">
                {(['skip', 'update'] as const).map(opt => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                    <input type="radio" checked={duplicateAction === opt} onChange={() => setDuplicateAction(opt)}
                      className="text-ink-900" />
                    {opt === 'skip' ? 'Skip duplicates' : 'Update existing'}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-ink-50 border-b border-ink-200">
                  <tr>
                    {['Row', 'Service Name', 'Entity Name', 'Expiration Date', 'Provider', 'Result'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-ink-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {preview.map(row => (
                    <tr key={row.row} className={!row.is_valid ? 'bg-status-dangerBg/30' : ''}>
                      <td className="px-3 py-2 text-ink-400 font-mono text-xs">{row.row}</td>
                      <td className="px-3 py-2 text-ink-900 font-medium">{row.service_name}</td>
                      <td className="px-3 py-2 text-ink-700">{row.entity_name}</td>
                      <td className="px-3 py-2 text-ink-600">{row.expiry_date}</td>
                      <td className="px-3 py-2 text-ink-500">{row.service_provider || '—'}</td>
                      <td className="px-3 py-2">
                        {!row.is_valid
                          ? <span className="flex items-center gap-1 text-status-danger text-xs"><XCircle size={12} /> {row.error}</span>
                          : row.is_duplicate
                            ? <span className="flex items-center gap-1 text-status-warning text-xs"><AlertTriangle size={12} /> Duplicate</span>
                            : <span className="flex items-center gap-1 text-status-healthy text-xs"><CheckCircle2 size={12} /> Ready</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={reset} className="btn-secondary">Cancel</button>
            <button onClick={handleImport} disabled={loading || validCount === 0} className="btn-primary">
              {loading ? 'Importing…' : `Import ${validCount} Service(s)`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Result ── */}
      {step === 'result' && result && (
        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-healthyBg mx-auto mb-4">
            <CheckCircle2 size={24} className="text-status-healthy" />
          </div>
          <h2 className="text-lg font-semibold text-ink-900 mb-1">Import Complete</h2>
          <p className="text-sm text-ink-500 mb-6">Your CSV has been processed</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Imported', value: result.imported, cls: 'bg-status-healthyBg border-status-healthyBorder text-status-healthy' },
              { label: 'Updated',  value: result.updated,  cls: 'bg-ink-50 border-ink-200 text-ink-700' },
              { label: 'Skipped',  value: result.skipped,  cls: 'bg-status-warningBg border-status-warningBorder text-status-warning' },
              { label: 'Invalid',  value: result.invalid,  cls: 'bg-status-dangerBg border-status-dangerBorder text-status-danger' },
            ].map(s => (
              <div key={s.label} className={`rounded-lg border p-3 ${s.cls}`}>
                <p className="text-xl font-semibold">{s.value}</p>
                <p className="text-xs text-ink-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 text-left rounded-lg bg-ink-50 p-3 max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-status-danger">{e}</p>
              ))}
            </div>
          )}
          <button onClick={reset} className="btn-primary mt-6"><ArrowLeft size={15} />Import Another File</button>
        </div>
      )}
    </AppLayout>
  )
}
