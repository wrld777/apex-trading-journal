# Frontend — Hooks & Services

tags: #frontend #hooks #services #tanstack

---

## Services (Axios API clients)

### apiClient.ts
```typescript
// Base URL: import.meta.env.VITE_API_URL  (es. https://localhost:7106)
// Request interceptor  → aggiunge header: Authorization: Bearer <token>
// Response interceptor → su 401 chiama clearAuth() e redirige a /login
```

### authService.ts
```typescript
authService.login(data: LoginRequest)     → POST /api/auth/login   → AuthResponse
authService.register(data: RegisterRequest) → POST /api/auth/register → AuthResponse
```

### tradeService.ts
```typescript
tradeService.create(userId, data: CreateTradeRequest) → POST /api/trade → TradeDto
// TODO (issue #40): aggiungere getAll(userId) → GET /api/trade/{userId}
```

### statsService.ts
```typescript
statsService.get({ userId, from?, to? }) → GET /api/stats?userId=...  → StatsDto
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
    queryFn: () => statsService.get({ userId: userId!, from, to }),
    enabled: !!userId,
    staleTime: 30_000,
  })
}
```

**Usato in:** Dashboard, Analytics (da collegare in #40)

---

### useCreateTrade — `src/hooks/useTrades.ts`
**Stato:** ✅ implementato (issue #39)

```typescript
export function useCreateTrade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, ...data }) => tradeService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      // invalida anche ['trades'] quando implementato
    },
  })
}
```

**Usato in:** LogTrade form

---

### useTrades (da implementare — issue #40)
```typescript
export function useTrades() {
  const userId = useAuthStore((s) => s.userId)
  return useQuery({
    queryKey: ['trades', userId],
    queryFn: () => tradeService.getAll(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  })
}
```

**Sarà usato in:** Analytics (Trade Log table), Dashboard (Recent Trades)

---

## Query Keys — Convenzione

| Key | Dati | Invalidato da |
|-----|------|---------------|
| `['stats', userId, from, to]` | StatsDto | useCreateTrade onSuccess |
| `['trades', userId]` | TradeDto[] | useCreateTrade onSuccess |

---

## Environment Variables

```bash
# frontend/.env
VITE_API_URL=https://localhost:7106   # dev locale
VITE_API_URL=https://api.apexjournal.com  # produzione (da configurare)
```

---

## Link Correlati
- [[State]] — authStore da cui i hook leggono userId
- [[Pages]] — le pagine che usano questi hook
- [[../03 - API/Trade API]] — endpoint chiamati da tradeService
- [[../03 - API/Stats API]] — endpoint chiamato da statsService
