import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { t } from '../i18n'

export default function RootError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-content-secondary text-sm">
        {t('error.notFound')}
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-neg text-sm">
      {t('error.unexpected')}
    </div>
  )
}
