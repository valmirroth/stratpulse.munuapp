import api from './api'
import type { User } from '../types'

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<User[]>('/users')
    return res.data ?? []
  },
  getById: async (id: number): Promise<User> => {
    const res = await api.get<User>(`/users/${id}`)
    return res.data
  },
  create: async (data: { name: string; email: string; password: string; role: string }): Promise<User> => {
    const res = await api.post<User>('/users', data)
    return res.data
  },
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const res = await api.put<User>(`/users/${id}`, data)
    return res.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
