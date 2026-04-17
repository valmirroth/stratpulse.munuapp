// ─── Auth ────────────────────────────────────────────────────
export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'manager' | 'maintainer'
  active: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest  { email: string; password: string }
export interface LoginResponse { token: string; user: User }

// ─── Assets ──────────────────────────────────────────────────
export type AssetType = 'plant' | 'area' | 'system' | 'subsystem' | 'equipment' | 'component'

export interface Asset {
  id: number
  parent_id: number | null
  code: string
  name: string
  description: string
  type: AssetType
  level: number
  active: boolean
  children?: Asset[]
  created_at: string
  updated_at: string
}

// ─── Accounts ────────────────────────────────────────────────
export type AccountType   = 'synthetic' | 'analytical'
export type AccountNature = 'debit' | 'credit'

export interface Account {
  id: number
  parent_id: number | null
  code: string
  name: string
  type: AccountType
  nature: AccountNature
  level: number
  active: boolean
  children?: Account[]
  created_at: string
  updated_at: string
}

// ─── Maintainers ─────────────────────────────────────────────
export interface Maintainer {
  id: number
  user_id: number | null
  name: string
  registration: string
  specialty: string
  phone: string
  email: string
  hourly_rate: number
  active: boolean
  created_at: string
  updated_at: string
}

// ─── Maintenance Plans ───────────────────────────────────────
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'hours'
export type Priority      = 'low' | 'medium' | 'high' | 'critical'

export interface MaintenancePlanTask {
  id: number
  plan_id: number
  sequence: number
  description: string
  estimated_minutes: number
}

export interface MaintenancePlan {
  id: number
  asset_id: number
  asset_name?: string
  account_id: number | null
  code: string
  name: string
  description: string
  frequency_type: FrequencyType
  frequency_value: number
  estimated_hours: number
  priority: Priority
  active: boolean
  tasks?: MaintenancePlanTask[]
  created_at: string
  updated_at: string
}

// ─── Work Orders ─────────────────────────────────────────────
export type WorkOrderType   = 'preventive' | 'corrective' | 'predictive'
export type WorkOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface WorkOrder {
  id: number
  code: string
  asset_id: number
  asset_name?: string
  plan_id: number | null
  account_id: number | null
  type: WorkOrderType
  priority: Priority
  status: WorkOrderStatus
  requested_date: string
  scheduled_date: string | null
  started_date: string | null
  completed_date: string | null
  description: string
  observations: string
  estimated_hours: number
  actual_hours: number
  total_cost: number
  created_by: number
  created_by_name?: string
  maintainers?: Maintainer[]
  created_at: string
  updated_at: string
}

// ─── Time Entries ────────────────────────────────────────────
export type TimeEntryStatus = 'pending' | 'approved' | 'rejected'

export interface TimeEntry {
  id: number
  work_order_id: number
  work_order_code?: string
  maintainer_id: number
  maintainer_name?: string
  start_time: string
  end_time: string | null
  hours: number
  description: string
  status: TimeEntryStatus
  approved_by: number | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

// ─── Helpers ─────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica',
}
export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}
export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  open: 'Aberta', in_progress: 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada',
}
export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  plant: 'Planta', area: 'Área', system: 'Sistema',
  subsystem: 'Subsistema', equipment: 'Equipamento', component: 'Componente',
}
export const FREQUENCY_LABELS: Record<FrequencyType, string> = {
  daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', hours: 'Horas',
}
