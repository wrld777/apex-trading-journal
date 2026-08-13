import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/authService'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.register(form)
      // No auto-login: send the user to login with a success notice.
      navigate('/login', { state: { registered: true } })
    } catch {
      setError('Registrazione fallita. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030304] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="7" width="4" height="6" rx="1" fill="black"/>
              <rect x="5" y="4" width="4" height="9" rx="1" fill="black" opacity=".7"/>
              <rect x="9" y="1" width="4" height="12" rx="1" fill="black" opacity=".4"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white tracking-widest text-sm">APEX</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">Crea account</h1>
        <p className="text-sm text-zinc-500 mb-8">Inizia a tracciare le tue performance</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 tracking-wide">Nome</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Ahmed"
                className="bg-[#141416] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 placeholder:text-zinc-600 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-500 tracking-wide">Cognome</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Bejaoui"
                className="bg-[#141416] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 tracking-wide">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="bg-[#141416] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 tracking-wide">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="bg-[#141416] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 placeholder:text-zinc-600 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white text-black font-medium text-sm rounded-md py-2.5 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creazione account…' : 'Registrati'}
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-6">
          Hai già un account?{' '}
          <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}