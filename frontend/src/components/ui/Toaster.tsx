import { useToastStore, type ToastType } from '../../store/toastStore'

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-500/10 border-green-500/25 text-green-400',
  error:   'bg-red-500/10 border-red-500/25 text-red-400',
  info:    'bg-[#1a1a1d] border-white/[0.1] text-zinc-300',
}

function Icon({ type }: { type: ToastType }) {
  if (type === 'success') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <polyline points="2,7 5.5,10.5 12,3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === 'error') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <line x1="3" y1="3" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="11" y1="3" x2="3" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="7" cy="4" r="0.8" fill="currentColor" />
    </svg>
  )
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          role="status"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-[13px] font-medium shadow-lg cursor-pointer transition-all ${STYLES[t.type]}`}
        >
          <Icon type={t.type} />
          {t.message}
        </div>
      ))}
    </div>
  )
}
