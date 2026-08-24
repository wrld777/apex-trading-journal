import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { Toaster, TooltipProvider } from './design-system'

export default function App() {
  return (
    /* `delayDuration` breve: su un grafico il suggerimento serve mentre si
       scorre con il puntatore, non dopo un secondo di attesa. */
    <TooltipProvider delayDuration={200} skipDelayDuration={300}>
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  )
}
