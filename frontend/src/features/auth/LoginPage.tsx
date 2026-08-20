import { useState } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useAuthStore } from '../../store/authStore'
import { t } from '../../i18n'
import { Button, Field, Input, Wordmark } from '../../design-system'

export default function LoginPage() {
  // Le pagine fuori dal telaio non passano da AppShell: il titolo se lo
  // dichiarano da sé.
  useDocumentTitle('/login')
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const state = location.state as { registered?: boolean; passwordReset?: boolean } | null
  const justRegistered = state?.registered ?? false
  const passwordReset = state?.passwordReset ?? false

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
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <Wordmark size={26} className="mb-8" />

        <h1 className="text-xl font-bold text-content-strong mb-1">{t('auth.welcomeBack')}</h1>
        <p className="text-sm text-content-secondary mb-8">{t('auth.signInSubtitle')}</p>

        {(justRegistered || passwordReset) && (
          <p className="text-xs text-pos bg-pos/10 border border-pos/20 rounded-md px-3 py-2 mb-4">
            {justRegistered ? t('auth.registered') : t('auth.passwordResetDone')}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label={t('auth.email')}>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value })
                setError(null)
              }}
              placeholder={t('auth.emailPlaceholder')}
            />
          </Field>

          <Field label={t('auth.password')}>
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value })
                setError(null)
              }}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p className="text-xs text-neg bg-neg/10 border border-neg/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button variant="primary" size="lg" block className="mt-2"
            type="submit"
            disabled={loading}
            
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>

        <p className="text-xs text-content-muted text-center mt-5">
          <Link to="/forgot-password" className="text-content-secondary hover:text-content-strong transition-colors">
            {t('auth.forgotLink')}
          </Link>
        </p>

        <p className="text-xs text-content-muted text-center mt-3">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-content-secondary hover:text-content-strong transition-colors">
            {t('auth.signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}