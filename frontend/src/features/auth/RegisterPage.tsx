import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/authService'
import { t } from '../../i18n'
import { Button, Field, Input, Wordmark } from '../../design-system'

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

        <Wordmark size={26} className="mb-8" />

        <h1 className="text-xl font-bold text-content-strong mb-1">{t('auth.createAccount')}</h1>
        <p className="text-sm text-content-secondary mb-8">{t('auth.createAccountSubtitle')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('auth.firstName')}>
              <Input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder={t('auth.firstNamePlaceholder')}
              />
            </Field>
            <Field label={t('auth.lastName')}>
              <Input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder={t('auth.lastNamePlaceholder')}
              />
            </Field>
          </div>

          <Field label={t('auth.email')}>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('auth.emailPlaceholder')}
            />
          </Field>

          <Field label={t('auth.password')}>
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
            {loading ? t('auth.signingUp') : t('auth.signUp')}
          </Button>
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