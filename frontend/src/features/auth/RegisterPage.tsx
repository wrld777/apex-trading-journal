import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { t } from '../../i18n'

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
      setError(t('auth.registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="7" width="4" height="6" rx="1" fill="black"/>
              <rect x="5" y="4" width="4" height="9" rx="1" fill="black" opacity=".7"/>
              <rect x="9" y="1" width="4" height="12" rx="1" fill="black" opacity=".4"/>
            </svg>
          </div>
          <span className="font-brand font-bold text-content-strong tracking-widest text-sm">{t('brand.name')}</span>
        </div>

        <h1 className="text-xl font-bold text-content-strong mb-1">{t('auth.createAccount')}</h1>
        <p className="text-sm text-content-secondary mb-8">{t('auth.createAccountSubtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-content-secondary tracking-wide">{t('auth.firstName')}</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder={t('auth.firstNamePlaceholder')}
                className="bg-surface-2 border border-white/10 rounded-md px-3 py-2.5 text-sm text-content-strong outline-none focus:border-white/25 placeholder:text-content-muted transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-content-secondary tracking-wide">{t('auth.lastName')}</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder={t('auth.lastNamePlaceholder')}
                className="bg-surface-2 border border-white/10 rounded-md px-3 py-2.5 text-sm text-content-strong outline-none focus:border-white/25 placeholder:text-content-muted transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-content-secondary tracking-wide">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('auth.emailPlaceholder')}
              className="bg-surface-2 border border-white/10 rounded-md px-3 py-2.5 text-sm text-content-strong outline-none focus:border-white/25 placeholder:text-content-muted transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-content-secondary tracking-wide">{t('auth.password')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="bg-surface-2 border border-white/10 rounded-md px-3 py-2.5 text-sm text-content-strong outline-none focus:border-white/25 placeholder:text-content-muted transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-neg bg-neg/10 border border-neg/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white text-black font-medium text-sm rounded-md py-2.5 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('auth.signingUp') : t('auth.signUp')}
          </button>
        </form>

        <p className="text-xs text-content-muted text-center mt-6">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-content-secondary hover:text-content-strong transition-colors">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}