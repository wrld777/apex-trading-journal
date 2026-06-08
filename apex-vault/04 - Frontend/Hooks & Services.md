# Frontend — Hooks & Services

tags: #frontend #hooks #services #tanstack

---

## Services (Axios API clients)

### apiClient.ts
```typescript
// Base URL: import.meta.env.VITE_API_URL  (es. https://localhost:7106)
//   → warn in console se mancante
// Request interceptor  → aggiunge header: Authorization: Bearer <token>
// Response interceptor:
//   - 401 (non auth route) → clearAuth() + redirect /login
//   - errore di rete (no response) → toast globale "Network error…"   (#41)
//   - 5xx → toast globale "Server error…"                              (#41)
```

### authService.ts
```typescript
authService.login(data: LoginRequest)       → POST /api/auth/login    → AuthResponse (token)
authService.register(data: RegisterRequest) → POST /api/auth/register → RegisterResponse (no token)
```

### tradeService.ts  — userId dal token (#52), non più nei parametri
```typescript
tradeService.create(data: CreateTradeRequest) → POST /api/trade → TradeDto
tradeService.getMine()                        → GET  /api/trade → TradeDto[]
```

### statsService.ts
```typescript
statsService.get({ from?, to? }) → GET /api/stats → StatsDto   // userId dal token
```

---

## Hooks (TanStack Query)

### useStats — `src/hooks/useStats.ts`
**Stato:** ✅ implementato (issue #38)

```typescript
export function useStats(from?: string, to?: string) {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['stats', userId, from, to],
    queryFn: () => statsService.get({ from, to }), // userId dal token (#52)
    enabled: !!userId,
    staleTime: 30_000,
  })
}
```

**Usato in:** Dashboard, Analytics

---

### useCreateTrade — `src/hooks/useTrades.ts`
**Stato:** ✅ implementato (issue #39)

```typescript
export function useCreateTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => tradeService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] }) // #40
    },
  })
}
```

**Usato in:** LogTrade form

---

### useTrades — `src/hooks/useTrades.ts`
**Stato:** ✅ implementato (issue #40)

```typescript
export function useTrades() {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['trades', userId],
    queryFn: () => tradeService.getMine(), // userId dal token (#52)
    enabled: !!userId,
    staleTime: 30_000,
  })
}
```

**Usato in:** Dashboard (Recent Trades). Analytics usa solo `useStats`.

---

## UI Components condivisi (`src/components/ui/`)

| Componente | File | Note |
|-----------|------|------|
| `Skeleton`, `KpiCardSkeleton`, `TableSkeleton` | `Skeleton.tsx` | Skeleton riutilizzabili (#41) |
| `EmptyState` | `EmptyState.tsx` | icona + titolo + descrizione + CTA `<Link>` (#41) |
| `Toaster` | `Toaster.tsx` | montato in `App`, legge `toastStore` (#41) |
| `KpiCard` | `KpiCard.tsx` | card KPI Dashboard |

**Toast globale:** `src/store/toastStore.ts` (Zustand) — `addToast(message, type)`; auto-dismiss 4s. Usato dall'`apiClient` per errori rete/5xx.

---

## Query Keys — Convenzione

| Key | Dati | Invalidato da |
|-----|------|---------------|
| `['stats', userId, from, to]` | StatsDto | useCreateTrade onSuccess |
| `['trades', userId]` | TradeDto[] | useCreateTrade onSuccess |

---

## Environment Variables

```bash
# frontend/.env  → ignorato da git (#41)
VITE_API_URL=https://localhost:7106   # dev locale
# frontend/.env.example → tracciato in git (template)
# produzione: VITE_API_URL=https://api.apexjournal.com (da configurare)
```
`.gitignore`: `.env` / `.env.*` ignorati, `!.env.example` tracciato. `apiClient` logga un warning se `VITE_API_URL` è assente.

---

## Link Correlati
- [[State]] — authStore da cui i hook leggono userId
- [[Pages]] — le pagine che usano questi hook
- [[../03 - API/Trade API]] — endpoint chiamati da tradeService
- [[../03 - API/Stats API]] — endpoint chiamato da statsService
