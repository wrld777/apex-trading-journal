/**
 * Le primitive del prodotto.
 *
 * Regola: una feature compone, non disegna. Se in `features/` compare una
 * classe di colore, un raggio o un'altezza scritti a mano, quel pezzo
 * appartiene a questa cartella.
 */

export { cn } from './cn'

export { default as Button, IconButton } from './Button'
export { default as Card, CardHeader } from './Card'
export { default as PageHeader } from './PageHeader'
export { default as Badge } from './Badge'
export { Stat, StatCard, StatRow } from './Stat'
export { default as Meter } from './Meter'
export type { StatTone } from './Stat'
export { default as Field } from './Field'
export { default as Checkbox } from './Checkbox'
export { default as SegmentedControl } from './SegmentedControl'
export type { Segment } from './SegmentedControl'
export { Input, Textarea, Select } from './Input'
export { Table, TableWrap, THead, TBody, TR, TH, TD, SortableTH } from './Table'
export { default as Modal } from './Modal'
export { default as Tooltip, TooltipProvider } from './Tooltip'
export { default as Toaster } from './Toaster'
export { default as EmptyState } from './EmptyState'
export { Skeleton, StatCardSkeleton, TableSkeleton } from './Skeleton'
