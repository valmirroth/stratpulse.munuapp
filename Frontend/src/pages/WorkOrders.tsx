import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, UserPlus, UserMinus, ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { workOrderService } from '../services/workOrder.service'
import { assetService } from '../services/asset.service'
import { maintenancePlanService } from '../services/maintenancePlan.service'
import { maintainerService } from '../services/maintainer.service'
import { accountService } from '../services/account.service'
import type {
  WorkOrder, WorkOrderType, WorkOrderStatus, Priority,
  Asset, MaintenancePlan, Maintainer, Account,
} from '../types'
import {
  PRIORITY_LABELS, PRIORITY_COLORS,
  STATUS_LABELS, STATUS_COLORS,
} from '../types'
import clsx from 'clsx'

type WOForm = {
  asset_id: string; plan_id: string; account_id: string
  type: WorkOrderType; priority: Priority
  scheduled_date: string; description: string; estimated_hours: string
}

const WO_TYPES: { value: WorkOrderType; label: string }[] = [
  { value: 'preventive', label: 'Preventiva' },
  { value: 'corrective', label: 'Corretiva' },
  { value: 'predictive', label: 'Preditiva' },
]

const STATUS_FLOW: { from: WorkOrderStatus; to: WorkOrderStatus; label: string; cls: string }[] = [
  { from: 'open',        to: 'in_progress', label: 'Iniciar',    cls: 'btn-primary' },
  { from: 'in_progress', to: 'completed',   label: 'Concluir',   cls: 'bg-green-600 text-white btn' },
  { from: 'open',        to: 'cancelled',   label: 'Cancelar',   cls: 'btn-danger' },
  { from: 'in_progress', to: 'cancelled',   label: 'Cancelar',   cls: 'btn-danger' },
]

export default function WorkOrders() {
  const [orders, setOrders]       = useState<WorkOrder[]>([])
  const [assets, setAssets]       = useState<Asset[]>([])
  const [plans, setPlans]         = useState<MaintenancePlan[]>([])
  const [maintainers, setMaintainers] = useState<Maintainer[]>([])
  const [accounts, setAccounts]   = useState<Account[]>([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editItem, setEditItem]   = useState<WorkOrder | null>(null)
  const [detailItem, setDetailItem] = useState<WorkOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType]     = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<WOForm>()

  const flattenAssets = (list: Asset[]): Asset[] =>
    list.flatMap(a => [a, ...flattenAssets(a.children ?? [])])

  const load = async () => {
    setLoading(true)
    try {
      const [wo, a, p, m, ac] = await Promise.all([
        workOrderService.getAll({ status: filterStatus, type: filterType }),
        assetService.getTree(),
        maintenancePlanService.getAll(),
        maintainerService.getAll(),
        accountService.getFlat(),
      ])
      setOrders(wo)
      setAssets(flattenAssets(a))
      setPlans(p)
      setMaintainers(m.filter(x => x.active))
      setAccounts(ac)
    } catch { toast.error('Erro ao carregar dados') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStatus, filterType])

  const loadDetail = async (id: number) => {
    try {
      const wo = await workOrderService.getById(id)
      setDetailItem(wo)
    } catch { toast.error('Erro ao carregar OS') }
  }

  const openCreate = () => {
    setEditItem(null)
    reset({ asset_id:'', plan_id:'', account_id:'', type:'corrective',
      priority:'medium', scheduled_date:'', description:'', estimated_hours:'0' })
    setShowModal(true)
  }

  const openEdit = (wo: WorkOrder) => {
    setEditItem(wo)
    reset({
      asset_id: wo.asset_id.toString(),
      plan_id: wo.plan_id?.toString() ?? '',
      account_id: wo.account_id?.toString() ?? '',
      type: wo.type, priority: wo.priority,
      scheduled_date: wo.scheduled_date ? wo.scheduled_date.slice(0, 10) : '',
      description: wo.description,
      estimated_hours: wo.estimated_hours.toString(),
    })
    setShowModal(true)
  }

  const openDetail = (wo: WorkOrder) => {
    loadDetail(wo.id)
    setShowDetail(true)
  }

  const onSubmit = async (data: WOForm) => {
    try {
      const payload = {
        asset_id: parseInt(data.asset_id),
        plan_id: data.plan_id ? parseInt(data.plan_id) : null,
        account_id: data.account_id ? parseInt(data.account_id) : null,
        type: data.type,
        priority: data.priority,
        scheduled_date: data.scheduled_date || null,
        description: data.description,
        estimated_hours: parseFloat(data.estimated_hours) || 0,
      }
      if (editItem) {
        await workOrderService.update(editItem.id, payload)
        toast.success('OS atualizada!')
      } else {
        await workOrderService.create(payload)
        toast.success('OS criada!')
      }
      setShowModal(false)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro ao salvar') }
  }

  const onDelete = async (wo: WorkOrder) => {
    if (!confirm(`Remover OS "${wo.code}"?`)) return
    try {
      await workOrderService.delete(wo.id)
      toast.success('OS removida')
      load()
    } catch { toast.error('Erro ao remover') }
  }

  const changeStatus = async (wo: WorkOrder, newStatus: WorkOrderStatus) => {
    const obs = newStatus === 'cancelled' ? prompt('Motivo do cancelamento:') ?? '' : ''
    try {
      await workOrderService.updateStatus(wo.id, newStatus, obs)
      toast.success('Status atualizado!')
      load()
      if (detailItem?.id === wo.id) loadDetail(wo.id)
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro ao atualizar status') }
  }

  const assignMaintainer = async (wo: WorkOrder, maintainerId: number) => {
    try {
      await workOrderService.assignMaintainer(wo.id, maintainerId)
      toast.success('Manutentor vinculado!')
      loadDetail(wo.id)
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro') }
  }

  const removeMaintainer = async (wo: WorkOrder, maintainerId: number) => {
    try {
      await workOrderService.removeMaintainer(wo.id, maintainerId)
      toast.success('Manutentor removido')
      loadDetail(wo.id)
    } catch { toast.error('Erro') }
  }

  const statusActions = (wo: WorkOrder) =>
    STATUS_FLOW.filter(sf => sf.from === wo.status)

  const PRIORITY_OPTIONS: Priority[]        = ['low','medium','high','critical']
  const STATUS_FILTER: WorkOrderStatus[]    = ['open','in_progress','completed','cancelled']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestão completa de OSs: preventivas, corretivas e preditivas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={15} /></button>
          <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={15} />Nova OS</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="input w-48"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {STATUS_FILTER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select
          className="input w-48"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {WO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Código','Ativo','Tipo','Prioridade','Status','Agendamento','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhuma OS encontrada</td></tr>
              ) : orders.map(wo => (
                <tr key={wo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(wo)}
                      className="font-mono font-semibold text-blue-600 hover:underline"
                    >{wo.code}</button>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">{wo.asset_name}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-100 text-gray-600">
                      {WO_TYPES.find(t => t.value === wo.type)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${PRIORITY_COLORS[wo.priority]}`}>{PRIORITY_LABELS[wo.priority]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_COLORS[wo.status]}`}>{STATUS_LABELS[wo.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {wo.scheduled_date ? new Date(wo.scheduled_date).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {statusActions(wo).slice(0,1).map(sa => (
                        <button key={sa.to}
                          onClick={() => changeStatus(wo, sa.to)}
                          className={clsx('text-xs px-2 py-1 rounded-md font-medium transition-colors', sa.cls)}
                        >{sa.label}</button>
                      ))}
                      <button onClick={() => openEdit(wo)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(wo)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {orders.length} ordem(ns) encontrada(s)
          </div>
        )}
      </div>

      {/* Modal Criar/Editar OS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">{editItem ? `Editar OS ${editItem.code}` : 'Nova Ordem de Serviço'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Ativo *</label>
                <select className="input" {...register('asset_id', { required: true })}>
                  <option value="">Selecione o ativo...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {'  '.repeat(a.level - 1)}{a.code} — {a.name}
                    </option>
                  ))}
                </select>
                {errors.asset_id && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" {...register('type', { required: true })}>
                    {WO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prioridade *</label>
                  <select className="input" {...register('priority', { required: true })}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Plano vinculado</label>
                  <select className="input" {...register('plan_id')}>
                    <option value="">Nenhum</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Conta de Custo</label>
                  <select className="input" {...register('account_id')}>
                    <option value="">Nenhuma</option>
                    {accounts.filter(a => a.type === 'analytical').map(a => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Data Agendada</label>
                  <input type="date" className="input" {...register('scheduled_date')} />
                </div>
                <div>
                  <label className="label">Horas Estimadas</label>
                  <input type="number" step="0.5" min="0" className="input" {...register('estimated_hours')} />
                </div>
              </div>
              <div>
                <label className="label">Descrição / Sintoma *</label>
                <textarea className="input" rows={3}
                  placeholder="Descreva o problema, sintoma ou atividade preventiva..."
                  {...register('description', { required: true })} />
                {errors.description && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhe da OS */}
      {showDetail && detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold font-mono">{detailItem.code}</h2>
                <p className="text-sm text-gray-500">{detailItem.asset_name}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Status badges */}
              <div className="flex gap-2 flex-wrap">
                <span className={`badge ${STATUS_COLORS[detailItem.status]}`}>{STATUS_LABELS[detailItem.status]}</span>
                <span className={`badge ${PRIORITY_COLORS[detailItem.priority]}`}>{PRIORITY_LABELS[detailItem.priority]}</span>
                <span className="badge bg-gray-100 text-gray-600">
                  {WO_TYPES.find(t => t.value === detailItem.type)?.label}
                </span>
              </div>

              {/* Ações de status */}
              <div className="flex gap-2">
                {statusActions(detailItem).map(sa => (
                  <button key={sa.to}
                    onClick={() => changeStatus(detailItem, sa.to)}
                    className={clsx('btn-sm', sa.cls)}
                  >{sa.label}</button>
                ))}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Solicitada em', new Date(detailItem.requested_date).toLocaleDateString('pt-BR')],
                  ['Agendada para', detailItem.scheduled_date ? new Date(detailItem.scheduled_date).toLocaleDateString('pt-BR') : '—'],
                  ['Horas estimadas', `${detailItem.estimated_hours}h`],
                  ['Horas reais', `${detailItem.actual_hours}h`],
                  ['Criado por', detailItem.created_by_name || '—'],
                  ['Custo total', `R$ ${detailItem.total_cost.toFixed(2)}`],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-xs text-gray-400 uppercase tracking-wide">{k}</dt>
                    <dd className="text-gray-800 mt-0.5">{v}</dd>
                  </div>
                ))}
              </div>

              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Descrição</dt>
                <dd className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailItem.description}</dd>
              </div>

              {detailItem.observations && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</dt>
                  <dd className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{detailItem.observations}</dd>
                </div>
              )}

              {/* Manutentores */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <UserPlus size={15} />Equipe Responsável
                </h4>
                <div className="space-y-1 mb-2">
                  {(!detailItem.maintainers || detailItem.maintainers.length === 0) ? (
                    <p className="text-sm text-gray-400 italic">Nenhum manutentor vinculado</p>
                  ) : detailItem.maintainers.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium text-gray-700">{m.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{m.specialty}</span>
                        <button
                          onClick={() => removeMaintainer(detailItem, m.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Remover"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Vincular novo */}
                {detailItem.status !== 'completed' && detailItem.status !== 'cancelled' && (
                  <select
                    className="input text-sm"
                    onChange={e => {
                      if (e.target.value) {
                        assignMaintainer(detailItem, parseInt(e.target.value))
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="">+ Vincular manutentor...</option>
                    {maintainers
                      .filter(m => !detailItem.maintainers?.find(dm => dm.id === m.id))
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.name} — {m.specialty}</option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
