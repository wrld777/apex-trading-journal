# Frontend — State Management

tags: #frontend #state #zustand #tanstack

Due livelli di state: **client state** (Zustand) e **server state** (TanStack Query).

---

## Client State — Zustand

### authStore (`src/store/authStore.ts`)

```typescript
interface AuthState {
  token:  string | null
  userId: string | null
  name:   string | null
  email:  string | null
  setAuth:   (token, userId, name, email) => void
  clearAuth: () => void
}
```

**Persistenza:** `localStorage` key `apex-auth` — sopravvive al refresh  
**Lettura:** `useAuthStore((s) => s.userId)` da qualsiasi componente  
**Reset:** `clearAuth()` chiamato da apiClient su risposta 401

### Quando viene scritto
| Evento | Azione |
|--------|--------|
| Login / Register successo | `setAuth(token, userId, name, email)` |
| Risposta 401 dall'API | `clearAuth()` → redirect `/login` |
| Logout manuale | `clearAuth()` |

---

## Server State — TanStack Query

Gestisce **fetch, cache, invalidazione e re-fetch** dei dati dal backend.

### Configurazione (`src/main.tsx`)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
})
// Wrappa l'app con <QueryClientProvider client={queryClient}>
```

### Cache attiva

| Query Key | TTL (staleTime) | Dati |
|-----------|----------------|------|
| `['stats', userId, from, to]` | 30s | StatsDto |
| `['trades', userId]` | 60s | TradeDto[] |

### Invalidazione
Quando si crea un trade → `invalidateQueries(['stats'])` forza il re-fetch delle stats → la Dashboard si aggiorna senza reload.

---

## Flusso Stato Completo

```
1. Utente apre l'app
   └─ authStore legge localStorage
      ├─ token trovato → utente autenticato → /
      └─ no token → /login

2. Utente logga
   └─ POST /api/auth/login
      └─ setAuth() → localStorage + Zustand
         └─ navigate('/')

3. Dashboard monta
   └─ useStats() → queryKey ['stats', userId]
      ├─ cache vuota → GET /api/stats → salva in cache 30s
      └─ cache valida → usa cache, zero fetch

4. Utente inserisce trade
   └─ useCreateTrade().mutate()
      └─ POST /api/trade
         └─ onSuccess:
            ├─ invalidateQueries(['stats']) → re-fetch stats
            ├─ Toast successo
            └─ reset form

5. Token scade / 401
   └─ apiClient interceptor → clearAuth() → navigate('/login')
```

---

## Link Correlati
- [[Hooks & Services]] — hook che leggono lo stato
- [[Pages]] — componenti che usano hook e store
- [[../03 - API/Auth API]] — endpoint che scrivono su authStore
