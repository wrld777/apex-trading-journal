import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { locale } from './i18n'

// `lang` sul documento non è decorazione: decide come uno screen reader
// pronuncia la pagina e come il browser sillaba il testo. In `index.html` è
// scritto "en" perché lì la lingua non si conosce ancora.
document.documentElement.lang = locale

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30 secondi
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)