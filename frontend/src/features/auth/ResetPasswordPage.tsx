import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button, Field, Input, Wordmark } from '../../design-system'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { t } from '../../i18n'
import { authService } from '../../services/authService'

/**
 * La seconda metà del reset: si arriva qui dal link nell'email, col token in
 * query string.
 *
 * I requisiti della password sono scritti **prima** di digitarla, non dopo aver
 * sbagliato: il server li applica comunque, e scoprirli da un errore è il modo
 * più lento di impararli.
 */
export default function ResetPasswordPage() {
  useDocumentTitle('/reset-password')

  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError(t('auth.passwordsDiffer'))
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      // Si rientra dal login, come dopo la registrazione: la password nuova va
      // usata subito, ed è il modo più diretto di verificarla.
      navigate('/login', { state: { passwordReset: true } })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t('auth.resetFailed')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Wordmark size={26} className="mb-8" />

        <h1 className="text-xl font-bold text-content-strong mb-1">{t('auth.resetTitle')}</h1>
        <p className="text-sm text-content-secondary mb-8">{t('auth.resetSubtitle')}</p>

        {!token ? (
          <p className="text-xs text-neg bg-neg/10 border border-neg/20 rounded-md px-3 py-2.5 leading-relaxed">
            {t('auth.resetNoToken')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label={t('auth.newPassword')} hint={t('auth.passwordRules')}>
              <Input
                type="password"
                required
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder="••••••••"
              />
            </Field>

            <Field label={t('auth.confirmPassword')}>
              <Input
                type="password"
                required
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null) }}
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="text-xs text-neg bg-neg/10 border border-neg/20 rounded-md px-3 py-2">{error}</p>
            )}

            <Button variant="primary" size="lg" block className="mt-2" type="submit" disabled={loading}>
              {loading ? t('auth.resetSubmitting') : t('auth.resetSubmit')}
            </Button>
          </form>
        )}

        <p className="text-xs text-content-muted text-center mt-6">
          <Link to="/forgot-password" className="text-content-secondary hover:text-content-strong transition-colors">
            {t('auth.askNewLink')}
          </Link>
        </p>
      </div>
    </div>
  )
}
