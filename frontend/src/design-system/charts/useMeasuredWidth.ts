import { useEffect, useRef, useState } from 'react'

/**
 * Larghezza reale dell'elemento, aggiornata a ogni ridimensionamento.
 *
 * È il pezzo che permette di disegnare in pixel veri invece che in un `viewBox`
 * poi stirato dal browser: senza misura, o si accetta la deformazione
 * (`preserveAspectRatio="none"`, che rendeva una linea da 2px spessa mezzo
 * pixel in orizzontale) o si accetta un grafico che non riempie la card.
 */
export function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setWidth(Math.round(entries[0]?.contentRect.width ?? 0))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, width] as const
}
