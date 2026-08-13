import { useRef, useState } from 'react'
import { useChangePassword, useProfile, useUpdateProfile } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { Skeleton } from '../../components/ui/Skeleton'
import { t } from '../../i18n'

const FIELD = 'bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full transition-all focus:border-white/[0.18] focus:bg-[#1a1a1d] placeholder:text-zinc-700'

/** Lato più lungo dell'avatar dopo il ridimensionamento. */
const AVATAR_SIZE = 256
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-zinc-600 tracking-[0.04em]">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-zinc-700">{hint}</span>}
    </label>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-6 flex flex-col gap-4">
      <div>
        <div className="text-[11px] text-zinc-600 uppercase tracking-widest">{title}</div>
        {subtitle && <div className="text-[10px] text-zinc-700 mt-1">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

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
    <div className="p-4 lg:p-7 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">{t('profile.title')}</h1>
        <p className="text-xs text-zinc-600">{t('profile.subtitle')}</p>
      </div>

      {isError ? (
        <div className="px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {t('profile.loadFailed')}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          <Card title={t('profile.yourDetails')}>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border border-white/[0.07]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-700 to-violet-700 flex items-center justify-center text-lg font-bold shrink-0">
                  {initials(firstName, lastName)}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="px-3 py-1.5 rounded-md text-[11px] text-zinc-300 border border-white/[0.07] hover:bg-[#1a1a1d] transition-all"
                  >
                    {avatarUrl ? t('profile.changePhoto') : t('profile.uploadPhoto')}
                  </button>
                  {avatarUrl && (
                    <button
                      onClick={() => { setAvatarUrl(null); if (fileInput.current) fileInput.current.value = '' }}
                      className="px-3 py-1.5 rounded-md text-[11px] text-zinc-500 border border-white/[0.07] hover:text-red-400 hover:border-red-500/20 transition-all"
                    >
                      {t('common.remove')}
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-700">{t('profile.photoHint', { size: AVATAR_SIZE })}</span>
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
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FIELD} placeholder="Ahmed" />
              </Field>
              <Field label={t('auth.lastName')} hint={t('common.optional')}>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FIELD} placeholder="Bejaoui" />
              </Field>
            </div>

            <Field label={t('auth.email')} hint={t('profile.emailHint')}>
              <input value={profile?.email ?? ''} disabled className={`${FIELD} opacity-60 cursor-not-allowed`} />
            </Field>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-60"
              >
                {isPending ? t('common.saving') : t('common.saveChanges')}
              </button>
            </div>
          </Card>

          <Card title={t('profile.passwordSection')} subtitle={t('profile.passwordRules')}>
            <Field label={t('profile.currentPassword')}>
              <input type="password" autoComplete="current-password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} className={FIELD} placeholder="••••••••" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('profile.newPassword')}>
                <input type="password" autoComplete="new-password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} className={FIELD} placeholder="••••••••" />
              </Field>
              <Field label={t('profile.repeatPassword')}>
                <input type="password" autoComplete="new-password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} className={FIELD} placeholder="••••••••" />
              </Field>
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={handleChangePassword}
                disabled={pwPending}
                className="px-4 py-1.5 rounded-md text-xs font-medium border border-white/[0.07] text-zinc-300 hover:bg-[#1a1a1d] transition-all disabled:opacity-60"
              >
                {pwPending ? t('profile.changingPassword') : t('profile.changePassword')}
              </button>
            </div>
          </Card>

        </div>
      )}
    </div>
  )
}
