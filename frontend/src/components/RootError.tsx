import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export default function RootError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen bg-[#030304] flex items-center justify-center text-zinc-500 text-sm">
        Pagina non trovata.
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#030304] flex items-center justify-center text-red-400 text-sm">
      Errore inaspettato.
    </div>
  )
}
