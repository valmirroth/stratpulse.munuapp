import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Check, X, Clock, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { timeEntryService } from '../services/timeEntry.service'
import { workOrderService } from '../services/workOrder.service'
import { maintainerService } from '../services/maintainer.service'
import type { TimeEntry, TimeEntryStatus, WorkOrder, Maintainer } from '../types'
import clsx from 'clsx'
import { useAuth } from '../contexts/AuthContext'

type EntryForm = {
  work_order_id: string; maintainer_id: string
  start_time: string; end_time: string; description: string
}

const STATUS_CFG: Record<TimeEntryStatus, { label: string; cls: string }> = {
  pending:  { label: 'Pendente',  cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprovado',  cls: 'bg-green-100 text-green-700'  },
  rejected: { label: 'Rejeitado', cls: 'bg-red-100 text-red-700'      },
}

export default function TimeEntries() {
  const { user } = useAuth()
  const [entries, setEntries]     = useState<TimeEntry[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [maintainers, setMaintainers] = useState<Maintainer[]>([])
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState<TimeEntry | null>(null)
  const [filterStatus, setFilterStatus] = useState('')

  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntryForm>()

  const load = async () => {
    setLoading(true)
    try {
      const [te, wo, m] = await Promise.all([
        timeEntryService.getAll(filterStatus),
        workOrderService.getAll({ status: 'in_progress' }),
        maintainerService.getAll(),
      ])
      setEntries(te)
      setWorkOrders(wo)
      setMaintainers(m.filter(x => x.active))
    } catch { toast.error('Erro ao carregar lançamentos') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterStatus])

  const openCreate = () => {
    setEditItem(null)
    const now = new Date()
    const fmt = (d: Date) => d.toISOString().slice(0,16)
    reset({
      work_order_id: '', maintainer_id: '',
      start_time: fmt(now), end_time: '', description: '',
    })
    setShowModal(true)
  }

  const openEdit = (te: TimeEntry) => {
    setEditItem(te)
    reset({
      work_order_id: te.work_order_id.toString(),
      maintainer_id: te.maintainer_id.toString(),
      start_time: te.start_time.slice(0,16),
      end_time: te.end_time?.slice(0,16) ?? '',
      description: te.description,
    })
    setShowModal(true)
  }

  const onSubmit = async (data: EntryForm) => {
    try {
      const payload = {
        work_order_id: parseInt(data.work_order_id),
        maintainer_id: parseInt(data.maintainer_id),
        start_time: new Date(data.start_time).toISOString(),
        end_time: data.end_time ? new Date(data.end_time).toISOString() : null,
        description: data.description,
      }
      if (editItem) {
        await timeEntryService.update(editItem.id, payload)
        toast.success('Lançamento atualizado!')
      } else {
        await timeEntryService.create(payload)
        toast.success('Horas lançadas com sucesso!')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao salvar')
    }
  }

  const onDelete = async (te: TimeEntry) => {
    if (!confirm('Excluir este lançamento?')) return
    try {
      await timeEntryService.delete(te.id)
      toast.success('Lançamento removido')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro') }
  }

  const onApprove = async (te: TimeEntry) => {
    try {
      await timeEntryService.approve(te.id)
      toast.success('Lançamento aprovado!')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro') }
  }

  const onReject = async (te: TimeEntry) => {
    try {
      await timeEntryService.reject(te.id)
      toast.success('Lançamento rejeitado')
      load()
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro') }
  }

  const fmtDT = (dt: string) => new Date(dt).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit',
  })

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const approvedHours = entries.filter(e => e.status === 'approved').reduce((s, e) => s + e.hours, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lançamento de Horas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Apontamento de tempo por manutentor e OS</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={15} /></button>
          <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={15} />Lançar Horas</button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Registros', value: entries.length, cls: 'bg-blue-50 text-blue-700' },
          { label: 'Horas Lançadas', value: `${totalHours.toFixed(1)}h`, cls: 'bg-purple-50 text-purple-700' },
          { label: 'Horas Aprovadas', value: `${approvedHours.toFixed(1)}h`, cls: 'bg-green-50 text-green-700' },
        ].map(({ label, value, cls }) => (
          <div key={label} className={`card p-4 ${cls}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="flex gap-3">
        <select className="input w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['OS','Manutentor','Início','Fim','Horas','Descrição','Status','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                  <Clock size={36} className="mx-auto mb-2 opacity-30" />
                  <p>Nenhum lançamento encontrado</p>
                </td></tr>
              ) : entries.map(te => (
                <tr key={te.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium">{te.work_order_code}</td>
                  <td className="px-4 py-3 text-gray-700">{te.maintainer_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{fmtDT(te.start_time)}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{te.end_time ? fmtDT(te.end_time) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800">{te.hours.toFixed(2)}h</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{te.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_CFG[te.status].cls}`}>{STATUS_CFG[te.status].label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {isManager && te.status === 'pending' && (
                        <>
                          <button onClick={() => onApprove(te)} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg" title="Aprovar">
                            <Check size={14} />
                          </button>
                          <button onClick={() => onReject(te)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Rejeitar">
                            <X size={14} />
                          </button>
                        </>
                      )}
                      {te.status === 'pending' && (
                        <button onClick={() => openEdit(te)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Editar">
                          <Clock size={14} />
                        </button>
                      )}
                      {te.status !== 'approved' && (
                        <button onClick={() => onDelete(te)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg" title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editItem ? 'Editar Lançamento' : 'Lançar Horas de Serviço'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Ordem de Serviço *</label>
                <select className="input" {...register('work_order_id', { required: true })}>
                  <option value="">Selecione a OS...</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.code} — {wo.asset_name}</option>
                  ))}
                </select>
                {errors.work_order_id && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
              <div>
                <label className="label">Manutentor *</label>
                <select className="input" {...register('maintainer_id', { required: true })}>
                  <option value="">Selecione o manutentor...</option>
                  {maintainers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.specialty}</option>
                  ))}
                </select>
                {errors.maintainer_id && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Início *</label>
                  <input type="datetime-local" className="input" {...register('start_time', { required: true })} />
                </div>
                <div>
                  <label className="label">Fim</label>
                  <input type="datetime-local" className="input" {...register('end_time')} />
                </div>
              </div>
              <div>
                <label className="label">Descrição das atividades</label>
                <textarea className="input" rows={3}
                  placeholder="Descreva o que foi executado..."
                  {...register('description')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  {editItem ? 'Atualizar' : 'Lançar Horas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
