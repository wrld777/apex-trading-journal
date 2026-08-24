import { useRef, useState } from 'react'
import { useChangePassword, useProfile, useUpdateProfile } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'

import { LOCALE_NAMES, LOCALES, setLocale, storedLocale, systemLocale, t, type Locale } from '../../i18n'
import { Button, Card, CardHeader, Field, Input, PageHeader, Select, Skeleton } from '../../design-system'

/** Lato più lungo dell'avatar dopo il ridimensionamento. */
const AVATAR_SIZE = 256
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function initials(first: string, last: string) {
  const a = first.trim()[0] ?? ''
  const b = last.trim()[0] ?? ''
  return (a + b).toUpperCase() || '—'
}

/**
 * Riduce l'immagine a un quadrato di AVATAR_SIZE e la restituisce come data URI.
 * Il ritaglio è centrale: così un ritratto verticale non esce schiacciato.
 * Si fa qui e non sul server perché evita di caricare megabyte per mostrare
 * poi una miniatura da 30px.
 */
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a valid image.'))
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Could not process the image.')); return }
        ctx.drawImage(
          img,
          (img.width - side) / 2, (img.height - side) / 2, side, side,
          0, 0, AVATAR_SIZE, AVATAR_SIZE,
        )
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  const { data: profile, isLoading, isError } = useProfile()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const { mutate: changePassword, isPending: pwPending } = useChangePassword()
  const addToast = useToastStore((s) => s.addToast)

  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.userId)
  const email = useAuthStore((s) => s.email)
  const setAuth = useAuthStore((s) => s.setAuth)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Seed the form once the profile has loaded.
  const [seeded, setSeeded] = useState(false)
  if (profile && !seeded) {
    setSeeded(true)
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setAvatarUrl(profile.avatarUrl)
  }

  const handlePick = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { addToast(t('profile.notAnImage'), 'error'); return }
    if (file.size > MAX_UPLOAD_BYTES) { addToast(t('profile.photoTooLarge'), 'error'); return }
    try {
      setAvatarUrl(await resizeToDataUrl(file))
    } catch (err) {
      addToast(err instanceof Error ? err.message : t('profile.imageFailed'), 'error')
    }
  }

  const handleSave = () => {
    if (!firstName.trim()) { addToast(t('profile.firstNameRequired'), 'error'); return }

    updateProfile(
      { firstName: firstName.trim(), lastName: lastName.trim(), avatarUrl },
      {
        onSuccess: (updated) => {
          addToast(t('profile.updated'), 'success')
          // Keep the cached auth identity (greeting, sidebar) in sync.
          if (token && userId) setAuth(token, userId, updated.displayName, email ?? updated.email)
        },
        onError: (err: unknown) => {
          addToast(err instanceof Error ? err.message : t('profile.updateFailed'), 'error')
        },
      },
    )
  }

  const handleChangePassword = () => {
    if (!currentPassword) { addToast(t('profile.currentPasswordRequired'), 'error'); return }
    if (newPassword !== confirmPassword) { addToast(t('profile.passwordsDoNotMatch'), 'error'); return }

    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          addToast(t('profile.passwordChanged'), 'success')
          setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        },
        onError: (err: unknown) => {
          addToast(err instanceof Error ? err.message : t('profile.passwordChangeFailed'), 'error')
        },
      },
    )
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      {isError ? (
        <div className="px-4 py-3 rounded-md bg-neg/10 border border-neg/20 text-neg text-xs">
          {t('profile.loadFailed')}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          <Card className="flex flex-col gap-4">
            <CardHeader title={t('profile.yourDetails')} />
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-line-2" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-lg font-bold shrink-0">
                  {initials(firstName, lastName)}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="px-3 py-1.5 rounded-md text-2xs text-content border border-line-2 hover:bg-surface-3 transition-all"
                  >
                    {avatarUrl ? t('profile.changePhoto') : t('profile.uploadPhoto')}
                  </button>
                  {avatarUrl && (
                    <button
                      onClick={() => { setAvatarUrl(null); if (fileInput.current) fileInput.current.value = '' }}
                      className="px-3 py-1.5 rounded-md text-2xs text-content-secondary border border-line-2 hover:text-neg hover:border-neg/20 transition-all"
                    >
                      {t('common.remove')}
                    </button>
                  )}
                </div>
                <span className="text-2xs text-content-faint">{t('profile.photoHint', { size: AVATAR_SIZE })}</span>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePick(e.target.files?.[0])}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('auth.firstName')}>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('auth.firstNamePlaceholder')} />
              </Field>
              <Field label={t('auth.lastName')} hint={t('common.optional')}>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('auth.lastNamePlaceholder')} />
              </Field>
            </div>

            <Field label={t('auth.email')} hint={t('profile.emailHint')}>
              <Input value={profile?.email ?? ''} disabled className="opacity-60 cursor-not-allowed" />
            </Field>

            <div className="flex justify-end pt-1">
              <Button variant="primary"
                onClick={handleSave}
                disabled={isPending}
                
              >
                {isPending ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </div>
          </Card>

          {/* La lingua sta nel profilo e non in un menu a bandierine: si sceglie
              una volta e non si tocca più, quindi non merita spazio permanente
              in ogni schermata. In automatico segue il browser, che è la cosa
              giusta per la stragrande maggioranza di chi apre l'app. */}
          <Card className="flex flex-col gap-4">
            <CardHeader title={t('profile.languageSection')} subtitle={t('profile.languageHint')} />
            <Field label={t('profile.language')}>
              <Select
                value={storedLocale() ?? 'auto'}
                onChange={(e) => setLocale(e.target.value === 'auto' ? null : (e.target.value as Locale))}
              >
                <option value="auto">{t('profile.languageAuto', { name: LOCALE_NAMES[systemLocale] })}</option>
                {LOCALES.map((code) => (
                  <option key={code} value={code}>{LOCALE_NAMES[code]}</option>
                ))}
              </Select>
            </Field>
          </Card>

          <Card className="flex flex-col gap-4">
            <CardHeader title={t('profile.passwordSection')} subtitle={t('profile.passwordRules')} />
            <Field label={t('profile.currentPassword')}>
              <Input type="password" autoComplete="current-password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('profile.newPassword')}>
                <Input type="password" autoComplete="new-password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              </Field>
              <Field label={t('profile.repeatPassword')}>
                <Input type="password" autoComplete="new-password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </Field>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleChangePassword}
                disabled={pwPending}
                
              >
                {pwPending ? t('profile.changingPassword') : t('profile.changePassword')}
              </Button>
            </div>
          </Card>

        </div>
      )}
    </div>
  )
}
