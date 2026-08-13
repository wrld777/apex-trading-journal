import { useState } from 'react'
import { useProfile, useUpdateProfile } from '../../hooks/useProfile'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { Skeleton } from '../../components/ui/Skeleton'

const FIELD = 'bg-[#141416] border border-white/[0.07] rounded-md px-3 py-2 text-[13px] text-white outline-none w-full transition-all focus:border-white/[0.18] focus:bg-[#1a1a1d] placeholder:text-zinc-700'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] text-zinc-600 tracking-[0.04em]">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-zinc-700">{hint}</span>}
    </label>
  )
}

export default function Profile() {
  const { data: profile, isLoading, isError } = useProfile()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const addToast = useToastStore((s) => s.addToast)

  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.userId)
  const email = useAuthStore((s) => s.email)
  const setAuth = useAuthStore((s) => s.setAuth)

  const [name, setName] = useState('')
  const [instrument, setInstrument] = useState('')

  // Seed the form once the profile has loaded.
  const [seeded, setSeeded] = useState(false)
  if (profile && !seeded) {
    setSeeded(true)
    setName(profile.name)
    setInstrument(profile.instrument)
  }

  const handleSave = () => {
    if (!name.trim()) { addToast('Name is required.', 'error'); return }
    if (!instrument.trim()) { addToast('Instrument is required.', 'error'); return }

    updateProfile(
      { name: name.trim(), instrument: instrument.trim() },
      {
        onSuccess: (updated) => {
          addToast('Profile updated.', 'success')
          // Keep the cached auth identity (greeting, etc.) in sync with the new name.
          if (token && userId) setAuth(token, userId, updated.name, email ?? updated.email)
        },
        onError: (err: unknown) => {
          addToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error')
        },
      },
    )
  }

  return (
    <div className="p-4 lg:p-7 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl lg:text-[22px] tracking-tight text-white leading-none mb-1">Profile</h1>
        <p className="text-xs text-zinc-600">Your details · used across your dashboard and analytics</p>
      </div>

      {isError ? (
        <div className="px-4 py-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          Failed to load your profile. Please try again later.
        </div>
      ) : (
        <div className="bg-[#111113] border border-white/[0.04] rounded-[10px] p-4 lg:p-6 flex flex-col gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            <>
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className={FIELD} placeholder="Your name" />
              </Field>

              <Field label="Email" hint="Email cannot be changed here.">
                <input value={profile?.email ?? ''} disabled className={`${FIELD} opacity-60 cursor-not-allowed`} />
              </Field>

              <Field label="Instrument" hint="e.g. NQ, ES, NAS100">
                <input value={instrument} onChange={(e) => setInstrument(e.target.value)} className={FIELD} placeholder="NQ Futures" />
              </Field>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isPending && (
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10"/>
                    </svg>
                  )}
                  {isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
