import api from './api'
import type { WorkOrder, WorkOrderStatus } from '../types'

export interface WorkOrderFilters {
  status?: string
  type?: string
  priority?: string
}

export const workOrderService = {
  getAll: async (filters?: WorkOrderFilters): Promise<WorkOrder[]> => {
    const params = new URLSearchParams()
    if (filters?.status)   params.set('status', filters.status)
    if (filters?.type)     params.set('type', filters.type)
    if (filters?.priority) params.set('priority', filters.priority)
    const res = await api.get<WorkOrder[]>(`/work-orders?${params}`)
    return res.data ?? []
  },
  getById: async (id: number): Promise<WorkOrder> => {
    const res = await api.get<WorkOrder>(`/work-orders/${id}`)
    return res.data
  },
  create: async (data: Partial<WorkOrder>): Promise<WorkOrder> => {
    const res = await api.post<WorkOrder>('/work-orders', data)
    return res.data
  },
  update: async (id: number, data: Partial<WorkOrder>): Promise<WorkOrder> => {
    const res = await api.put<WorkOrder>(`/work-orders/${id}`, data)
    return res.data
  },
  updateStatus: async (id: number, status: WorkOrderStatus, observations?: string): Promise<void> => {
    await api.put(`/work-orders/${id}/status`, { status, observations })
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/work-orders/${id}`)
  },
  assignMaintainer: async (workOrderId: number, maintainerId: number): Promise<void> => {
    await api.post(`/work-orders/${workOrderId}/maintainers`, { maintainer_id: maintainerId })
  },
  removeMaintainer: async (workOrderId: number, maintainerId: number): Promise<void> => {
    await api.delete(`/work-orders/${workOrderId}/maintainers/${maintainerId}`)
  },
  getStats: async (): Promise<Record<string, number>> => {
    const res = await api.get<Record<string, number>>('/work-orders/stats')
    return res.data ?? {}
  },
}
