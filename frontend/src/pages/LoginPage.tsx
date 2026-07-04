import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ShieldCheck } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900 mb-4">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Domain Tracker</h1>
          <p className="text-sm text-ink-500 mt-1">Sign in to manage your domains</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-status-dangerBg border border-status-dangerBorder px-3 py-2 text-sm text-status-danger">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="admin"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
