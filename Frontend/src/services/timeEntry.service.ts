import api from './api'
import type { TimeEntry } from '../types'

export const timeEntryService = {
  getAll: async (status?: string): Promise<TimeEntry[]> => {
    const params = status ? `?status=${status}` : ''
    const res = await api.get<TimeEntry[]>(`/time-entries${params}`)
    return res.data ?? []
  },
  getById: async (id: number): Promise<TimeEntry> => {
    const res = await api.get<TimeEntry>(`/time-entries/${id}`)
    return res.data
  },
  getByWorkOrder: async (workOrderId: number): Promise<TimeEntry[]> => {
    const res = await api.get<TimeEntry[]>(`/work-orders/${workOrderId}/time-entries`)
    return res.data ?? []
  },
  create: async (data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const res = await api.post<TimeEntry>('/time-entries', data)
    return res.data
  },
  update: async (id: number, data: Partial<TimeEntry>): Promise<TimeEntry> => {
    const res = await api.put<TimeEntry>(`/time-entries/${id}`, data)
    return res.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/time-entries/${id}`)
  },
  approve: async (id: number): Promise<void> => {
    await api.put(`/time-entries/${id}/approve`)
  },
  reject: async (id: number): Promise<void> => {
    await api.put(`/time-entries/${id}/reject`)
  },
}
