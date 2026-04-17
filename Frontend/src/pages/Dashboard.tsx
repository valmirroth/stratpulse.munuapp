import { useState, useEffect } from 'react'
import {
  Wrench, FileText, Clock, Users, TrendingUp,
  AlertCircle, CheckCircle, XCircle, BarChart2,
  RefreshCw, GitBranch,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { dashboardService, type DashboardStats } from '../services/dashboard.service'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from '../types'
import type { WorkOrderStatus, Priority } from '../types'
import clsx from 'clsx'

const MONTH_NAMES: Record<string, string> = {
  '01':'Jan','02':'Fev','03':'Mar','04':'Abr',
  '05':'Mai','06':'Jun','07':'Jul','08':'Ago',
  '09':'Set','10':'Out','11':'Nov','12':'Dez',
}

function fmt(m: string) {
  const [, mm] = m.split('-')
  return MONTH_NAMES[mm] ?? m
}

function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`${color} rounded-xl p-3 flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      setStats(await dashboardService.getStats())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const maxMonthHours = stats ? Math.max(...stats.monthly_hours.map(m => m.hours), 1) : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            Bem-vindo, <span className="font-medium text-gray-700">{user?.name}</span>. Visão geral do sistema.
          </p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-yellow-700 text-sm">
          <AlertCircle size={18} />
          Não foi possível carregar os dados. Verifique a conexão com o backend.
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({length: 6}).map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />
          ))
        ) : stats ? (
          <>
            <KpiCard label="OS Abertas"        value={stats.work_orders.open}        icon={FileText}   color="bg-yellow-500" />
            <KpiCard label="Em Andamento"      value={stats.work_orders.in_progress}  icon={TrendingUp} color="bg-blue-500"   />
            <KpiCard label="Concluídas"        value={stats.work_orders.completed}    icon={CheckCircle}color="bg-green-500"  />
            <KpiCard label="Canceladas"        value={stats.work_orders.cancelled}    icon={XCircle}    color="bg-gray-400"   />
            <KpiCard label="Ativos Cadastrados"value={stats.assets_total}             icon={GitBranch}  color="bg-purple-500" />
            <KpiCard
              label="Manutentores Ativos"
              value={stats.maintainers_active}
              icon={Users}
              color="bg-teal-500"
              sub={`${stats.time_entries.total_hours.toFixed(0)}h aprovadas`}
            />
          </>
        ) : null}
      </div>

      {/* Linha intermediária */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Status das OSs — donut visual */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-500" />
            Status das Ordens
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-8 animate-pulse bg-gray-100 rounded-lg" />)}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              {([
                ['open',        stats.work_orders.open,        'bg-yellow-400'],
                ['in_progress', stats.work_orders.in_progress,  'bg-blue-400'],
                ['completed',   stats.work_orders.completed,    'bg-green-400'],
                ['cancelled',   stats.work_orders.cancelled,    'bg-gray-300'],
              ] as [WorkOrderStatus, number, string][]).map(([status, count, barColor]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                    <span className="font-semibold text-gray-700">{count}</span>
                  </div>
                  <MiniBar value={count} max={stats.work_orders.total || 1} color={barColor} />
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-gray-700">{stats.work_orders.total}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Apontamentos de horas */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-teal-500" />
            Apontamento de Horas
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse bg-gray-100 rounded-xl" />)}
            </div>
          ) : stats ? (
            <div className="space-y-3">
              {([
                { label: 'Horas Aprovadas', value: stats.time_entries.total_hours.toFixed(1)+'h', cls: 'bg-green-50 text-green-700', dot:'bg-green-400' },
                { label: 'Pendentes de aprovação', value: stats.time_entries.pending, cls: 'bg-yellow-50 text-yellow-700', dot:'bg-yellow-400' },
                { label: 'Rejeitados', value: stats.time_entries.rejected, cls: 'bg-red-50 text-red-600', dot:'bg-red-400' },
              ]).map(({ label, value, cls, dot }) => (
                <div key={label} className={`flex items-center justify-between rounded-xl px-4 py-3 ${cls}`}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    {label}
                  </div>
                  <span className="font-bold text-lg">{value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Top manutentores */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Wrench size={16} className="text-orange-500" />
            Top Manutentores
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-8 animate-pulse bg-gray-100 rounded-lg" />)}
            </div>
          ) : stats && stats.top_maintainers.length > 0 ? (
            <div className="space-y-2">
              {stats.top_maintainers.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                  )}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.orders} OS(s)</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">{m.hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum dado disponível</p>
          )}
        </div>
      </div>

      {/* Horas por mês + OSs recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Gráfico de barras - horas por mês */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-5 flex items-center gap-2">
            <BarChart2 size={16} className="text-purple-500" />
            Horas Aprovadas — Últimos 6 meses
          </h2>
          {loading ? (
            <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />
          ) : stats && stats.monthly_hours.length > 0 ? (
            <div className="flex items-end gap-3 h-40">
              {stats.monthly_hours.map((m) => {
                const pct = maxMonthHours > 0 ? (m.hours / maxMonthHours) * 100 : 0
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-600">{m.hours.toFixed(0)}h</span>
                    <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: '96px' }}>
                      <div
                        className="bg-blue-500 rounded-t-md absolute bottom-0 w-full transition-all"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{fmt(m.month)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Sem dados de horas para exibir
            </div>
          )}
        </div>

        {/* OSs recentes */}
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            Ordens Recentes
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 animate-pulse bg-gray-100 rounded-lg" />)}
            </div>
          ) : stats && stats.recent_orders.length > 0 ? (
            <div className="space-y-1.5 overflow-y-auto max-h-52">
              {stats.recent_orders.map((ro) => (
                <div key={ro.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="font-mono text-xs text-blue-600 font-semibold w-28 flex-shrink-0">{ro.code}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{ro.asset_name}</span>
                  <span className={`badge ${PRIORITY_COLORS[ro.priority as Priority]} flex-shrink-0`}>
                    {PRIORITY_LABELS[ro.priority as Priority]}
                  </span>
                  <span className={`badge ${STATUS_COLORS[ro.status as WorkOrderStatus]} flex-shrink-0`}>
                    {STATUS_LABELS[ro.status as WorkOrderStatus]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Nenhuma ordem cadastrada ainda</p>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Nova OS',              href: '/work-orders',       icon: FileText,   color: 'text-blue-600 bg-blue-50'   },
            { label: 'Lançar Horas',         href: '/time-entries',      icon: Clock,      color: 'text-teal-600 bg-teal-50'   },
            { label: 'Cadastrar Ativo',      href: '/assets',            icon: GitBranch,  color: 'text-purple-600 bg-purple-50'},
            { label: 'Novo Plano Prev.',     href: '/maintenance-plans', icon: Wrench,     color: 'text-orange-600 bg-orange-50'},
          ].map(({ label, href, icon: Icon, color }) => (
            <a key={href} href={href}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={18} />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
