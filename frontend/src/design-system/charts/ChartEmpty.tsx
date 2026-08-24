/**
 * Il posto del grafico quando non c'è niente da disegnare.
 *
 * Occupa la stessa altezza del grafico pieno: se il vuoto collassa, la pagina
 * si riassesta appena arrivano i dati e tutto quello che sta sotto salta.
 */
export default function ChartEmpty({ height = 180, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div style={{ height }} className="flex items-center justify-center text-xs text-content-muted">
      {children}
    </div>
  )
}
