import apiClient from './apiClient'
import type { InstrumentDto } from '../types/instrument'

export const instrumentService = {
  // Global catalog: same list for every user, ordered by symbol server-side.
  getAll: async (): Promise<InstrumentDto[]> => {
    const res = await apiClient.get<InstrumentDto[]>('/api/instrument')
    return res.data
  },
}
