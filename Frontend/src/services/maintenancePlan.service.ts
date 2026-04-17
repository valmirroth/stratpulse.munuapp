import api from './api'
import type { MaintenancePlan, MaintenancePlanTask } from '../types'

export const maintenancePlanService = {
  getAll: async (): Promise<MaintenancePlan[]> => {
    const res = await api.get<MaintenancePlan[]>('/maintenance-plans')
    return res.data ?? []
  },
  getById: async (id: number): Promise<MaintenancePlan> => {
    const res = await api.get<MaintenancePlan>(`/maintenance-plans/${id}`)
    return res.data
  },
  create: async (data: Partial<MaintenancePlan>): Promise<MaintenancePlan> => {
    const res = await api.post<MaintenancePlan>('/maintenance-plans', data)
    return res.data
  },
  update: async (id: number, data: Partial<MaintenancePlan>): Promise<MaintenancePlan> => {
    const res = await api.put<MaintenancePlan>(`/maintenance-plans/${id}`, data)
    return res.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/maintenance-plans/${id}`)
  },
  getTasks: async (id: number): Promise<MaintenancePlanTask[]> => {
    const res = await api.get<MaintenancePlanTask[]>(`/maintenance-plans/${id}/tasks`)
    return res.data ?? []
  },
  createTask: async (planId: number, data: Partial<MaintenancePlanTask>): Promise<MaintenancePlanTask> => {
    const res = await api.post<MaintenancePlanTask>(`/maintenance-plans/${planId}/tasks`, data)
    return res.data
  },
  updateTask: async (planId: number, taskId: number, data: Partial<MaintenancePlanTask>): Promise<MaintenancePlanTask> => {
    const res = await api.put<MaintenancePlanTask>(`/maintenance-plans/${planId}/tasks/${taskId}`, data)
    return res.data
  },
  deleteTask: async (planId: number, taskId: number): Promise<void> => {
    await api.delete(`/maintenance-plans/${planId}/tasks/${taskId}`)
  },
}
