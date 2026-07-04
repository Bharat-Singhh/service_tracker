import { useEffect, useState } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/ui/States'
import { api } from '@/lib/api'
import { Settings } from '@/types'

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState(587)
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [recipients, setRecipients] = useState('')

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        const s = res.data
        setSettings(s)
        setSmtpHost(s.smtp_host || 'smtp-mail.outlook.com')
        setSmtpPort(s.smtp_port || 587)
        setSmtpUsername(s.smtp_username || '')
        setSmtpFrom(s.smtp_from || '')
        setRecipients(s.recipients || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const payload: any = {
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_username: smtpUsername,
        smtp_from: smtpFrom,
        recipients,
      }
      if (smtpPassword) payload.smtp_password = smtpPassword
      await api.put('/settings', payload)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <LoadingSpinner label="Loading settings..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-0.5">Configure SMTP email settings for expiry reminders</p>
      </div>

      <div className="max-w-2xl space-y-5">
        {error && (
          <div className="rounded-lg bg-status-dangerBg border border-status-dangerBorder px-4 py-3 text-sm text-status-danger">
            {error}
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink-900 mb-1">Outlook SMTP Configuration</h2>
          <p className="text-xs text-ink-500 mb-5">
            Used to send domain and SSL expiry reminder emails (7 days and 1 day before expiry)
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1.5">SMTP Host</label>
                <input
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp-mail.outlook.com"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">SMTP Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">SMTP Username</label>
              <input
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="you@outlook.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">SMTP Password</label>
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder={settings?.smtp_username ? '•••••••• (unchanged)' : 'Enter password'}
                className="input-field"
              />
              <p className="text-xs text-ink-400 mt-1">Leave blank to keep the existing password</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">From Address</label>
              <input
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                placeholder="you@outlook.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Recipients</label>
              <textarea
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="admin@example.com, ops@example.com"
                rows={2}
                className="input-field resize-none"
              />
              <p className="text-xs text-ink-400 mt-1">Comma-separated list of email addresses</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-status-healthy">
              <CheckCircle2 size={15} />
              Settings saved
            </span>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
