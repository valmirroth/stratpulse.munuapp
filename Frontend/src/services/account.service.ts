import api from './api'
import type { Account } from '../types'

export const accountService = {
  getTree: async (): Promise<Account[]> => {
    const res = await api.get<Account[]>('/accounts')
    return res.data ?? []
  },
  getFlat: async (): Promise<Account[]> => {
    const res = await api.get<Account[]>('/accounts/flat')
    return res.data ?? []
  },
  getById: async (id: number): Promise<Account> => {
    const res = await api.get<Account>(`/accounts/${id}`)
    return res.data
  },
  create: async (data: Partial<Account>): Promise<Account> => {
    const res = await api.post<Account>('/accounts', data)
    return res.data
  },
  update: async (id: number, data: Partial<Account>): Promise<Account> => {
    const res = await api.put<Account>(`/accounts/${id}`, data)
    return res.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`)
  },
}
