import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { t } from '../../i18n'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const justRegistered = (location.state as { registered?: boolean } | null)?.registered ?? false

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    const res = await authService.login(form)
    setAuth(res.token, res.userId, res.name, res.email)
    navigate('/')
  } catch {
    setError(t('auth.invalidCredentials'))
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
          <span className="font-bold text-white tracking-widest text-sm">{t('brand.name')}</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-1">{t('auth.welcomeBack')}</h1>
        <p className="text-sm text-zinc-500 mb-8">{t('auth.signInSubtitle')}</p>

        {justRegistered && (
          <p className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-md px-3 py-2 mb-4">
            {t('auth.registered')}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 tracking-wide">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value })
                setError(null)
              }}
              placeholder={t('auth.emailPlaceholder')}
              className="bg-[#141416] border border-white/10 rounded-md px-3 py-2.5 text-sm text-white outline-none focus:border-white/25 placeholder:text-zinc-600 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500 tracking-wide">{t('auth.password')}</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value })
                setError(null)
              }}
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
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-6">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-zinc-400 hover:text-white transition-colors">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}