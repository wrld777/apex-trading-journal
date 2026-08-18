import { Link } from 'react-router-dom'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  actionTo?: string
  className?: string
}

function DefaultIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="4" y="6" width="26" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="22" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="22" x2="14" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="22" x2="19" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="22" x2="24" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function EmptyState({
  title, description, icon, actionLabel, actionTo, className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      <div className="text-content-faint mb-3">{icon ?? <DefaultIcon />}</div>
      <div className="text-sm font-medium text-content mb-1">{title}</div>
      {description && <div className="text-xs text-content-muted max-w-xs mb-4">{description}</div>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-white/90 transition-all"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
