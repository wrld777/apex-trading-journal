import * as RadixTooltip from '@radix-ui/react-tooltip'

/**
 * Suggerimento al passaggio del mouse e al focus da tastiera.
 *
 * Finora l'unico modo di leggere un valore su un grafico era l'attributo
 * `title` del browser, che compare dopo un secondo abbondante, non si apre col
 * Tab e non si può intonare. Radix lo apre anche al focus, il che significa
 * che l'informazione esiste anche per chi non usa il mouse.
 */

/** Da montare una volta sola, in cima all'app. */
export const TooltipProvider = RadixTooltip.Provider

export default function Tooltip({
  content, children, side = 'top',
}: {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  if (!content) return <>{children}</>

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-toast max-w-xs rounded border border-line-2 bg-surface-3 px-2 py-1 text-2xs text-content shadow-lg"
        >
          {content}
          <RadixTooltip.Arrow className="fill-surface-3" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
