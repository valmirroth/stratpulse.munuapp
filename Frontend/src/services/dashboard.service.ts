import api from './api'

export interface WorkOrderStats {
  open: number
  in_progress: number
  completed: number
  cancelled: number
  total: number
}

export interface TimeEntryStats {
  pending: number
  approved: number
  rejected: number
  total_hours: number
}

export interface RecentOrder {
  id: number
  code: string
  asset_name: string
  type: string
  priority: string
  status: string
  created_at: string
}

export interface TopMaintainer {
  name: string
  hours: number
  orders: number
}

export interface MonthlyHour {
  month: string
  hours: number
}

export interface DashboardStats {
  work_orders: WorkOrderStats
  time_entries: TimeEntryStats
  assets_total: number
  maintainers_active: number
  recent_orders: RecentOrder[]
  top_maintainers: TopMaintainer[]
  monthly_hours: MonthlyHour[]
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/dashboard/stats')
    return res.data
  },
}
