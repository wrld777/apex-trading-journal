import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button, Field, Input, Wordmark } from '../../design-system'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { t } from '../../i18n'
import { authService } from '../../services/authService'

/**
 * "Ho dimenticato la password".
 *
 * La conferma è la stessa che l'indirizzo esista o no, e non è una svista: una
 * risposta diversa nei due casi trasformerebbe questa pagina in un modo di
 * scoprire chi è iscritto, provando indirizzi uno alla volta. Il server si
 * comporta allo stesso modo.
 */
export default function ForgotPasswordPage() {
  useDocumentTitle('/forgot-password')

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.forgotPassword(email)
    } catch {
      // Anche un guasto non cambia il messaggio: dire "non ha funzionato"
      // significherebbe far distinguere i due casi dall'esterno.
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Wordmark size={26} className="mb-8" />

        <h1 className="text-xl font-bold text-content-strong mb-1">{t('auth.forgotTitle')}</h1>
        <p className="text-sm text-content-secondary mb-8">{t('auth.forgotSubtitle')}</p>

        {sent ? (
          <p className="text-xs text-pos bg-pos/10 border border-pos/20 rounded-md px-3 py-2.5 leading-relaxed">
            {t('auth.forgotSent')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label={t('auth.email')}>
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
              />
            </Field>

            <Button variant="primary" size="lg" block className="mt-2" type="submit" disabled={loading}>
              {loading ? t('auth.forgotSending') : t('auth.forgotSubmit')}
            </Button>
          </form>
        )}

        <p className="text-xs text-content-muted text-center mt-6">
          <Link to="/login" className="text-content-secondary hover:text-content-strong transition-colors">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
