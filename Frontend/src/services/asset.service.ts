import api from './api'
import type { Asset } from '../types'

export const assetService = {
  getTree: async (): Promise<Asset[]> => {
    const res = await api.get<Asset[]>('/assets')
    return res.data ?? []
  },
  getById: async (id: number): Promise<Asset> => {
    const res = await api.get<Asset>(`/assets/${id}`)
    return res.data
  },
  create: async (data: Partial<Asset>): Promise<Asset> => {
    const res = await api.post<Asset>('/assets', data)
    return res.data
  },
  update: async (id: number, data: Partial<Asset>): Promise<Asset> => {
    const res = await api.put<Asset>(`/assets/${id}`, data)
    return res.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/assets/${id}`)
  },
}
