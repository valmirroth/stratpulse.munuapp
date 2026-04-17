import api from './api'
import type { Maintainer } from '../types'

export const maintainerService = {
  getAll: async (): Promise<Maintainer[]> => {
    const res = await api.get<Maintainer[]>('/maintainers')
    return res.data ?? []
  },
  getById: async (id: number): Promise<Maintainer> => {
    const res = await api.get<Maintainer>(`/maintainers/${id}`)
    return res.data
  },
  create: async (data: Partial<Maintainer>): Promise<Maintainer> => {
    const res = await api.post<Maintainer>('/maintainers', data)
    return res.data
  },
  update: async (id: number, data: Partial<Maintainer>): Promise<Maintainer> => {
    const res = await api.put<Maintainer>(`/maintainers/${id}`, data)
    return res.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/maintainers/${id}`)
  },
}
