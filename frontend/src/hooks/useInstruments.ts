import { useQuery } from '@tanstack/react-query'
import { instrumentService } from '../services/instrumentService'
import { useAuthStore } from '../store/authStore'

// The catalog is a seeded constant: no per-user key and effectively never stale
// within a session, so it is fetched once and reused by every form.
export function useInstruments() {
  const userId = useAuthStore((s) => s.userId)

  return useQuery({
    queryKey: ['instruments'],
    queryFn: () => instrumentService.getAll(),
    enabled: !!userId,
    staleTime: Infinity,
  })
}
