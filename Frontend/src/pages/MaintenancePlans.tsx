import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Pencil, Trash2, ChevronDown, ChevronRight, ListChecks } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { maintenancePlanService } from '../services/maintenancePlan.service'
import { assetService } from '../services/asset.service'
import { accountService } from '../services/account.service'
import type { MaintenancePlan, MaintenancePlanTask, Asset, Account, FrequencyType, Priority } from '../types'
import { PRIORITY_LABELS, PRIORITY_COLORS, FREQUENCY_LABELS } from '../types'
import clsx from 'clsx'

type PlanForm = {
  code: string; name: string; description: string
  asset_id: string; account_id: string
  frequency_type: FrequencyType; frequency_value: string
  estimated_hours: string; priority: Priority; active: boolean
}

type TaskForm = { sequence: string; description: string; estimated_minutes: string }

export default function MaintenancePlans() {
  const [plans, setPlans]         = useState<MaintenancePlan[]>([])
  const [assets, setAssets]       = useState<Asset[]>([])
  const [accounts, setAccounts]   = useState<Account[]>([])
  const [loading, setLoading]     = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editPlan, setEditPlan]   = useState<MaintenancePlan | null>(null)
  const [editTask, setEditTask]   = useState<MaintenancePlanTask | null>(null)
  const [activePlan, setActivePlan] = useState<MaintenancePlan | null>(null)
  const [expanded, setExpanded]   = useState<number[]>([])

  const planForm = useForm<PlanForm>()
  const taskForm = useForm<TaskForm>()

  const flattenAssets = (list: Asset[]): Asset[] =>
    list.flatMap(a => [a, ...flattenAssets(a.children ?? [])])

  const load = async () => {
    setLoading(true)
    try {
      const [p, a, ac] = await Promise.all([
        maintenancePlanService.getAll(),
        assetService.getTree(),
        accountService.getFlat(),
      ])
      setPlans(p)
      setAssets(flattenAssets(a))
      setAccounts(ac)
    } catch { toast.error('Erro ao carregar dados') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreatePlan = () => {
    setEditPlan(null)
    planForm.reset({ code:'', name:'', description:'', asset_id:'', account_id:'',
      frequency_type:'monthly', frequency_value:'1', estimated_hours:'0',
      priority:'medium', active: true })
    setShowPlanModal(true)
  }

  const openEditPlan = (p: MaintenancePlan) => {
    setEditPlan(p)
    planForm.reset({
      code: p.code, name: p.name, description: p.description,
      asset_id: p.asset_id.toString(), account_id: p.account_id?.toString() ?? '',
      frequency_type: p.frequency_type, frequency_value: p.frequency_value.toString(),
      estimated_hours: p.estimated_hours.toString(), priority: p.priority, active: p.active,
    })
    setShowPlanModal(true)
  }

  const onSubmitPlan = async (data: PlanForm) => {
    try {
      const payload = {
        ...data,
        asset_id: parseInt(data.asset_id),
        account_id: data.account_id ? parseInt(data.account_id) : null,
        frequency_value: parseInt(data.frequency_value),
        estimated_hours: parseFloat(data.estimated_hours),
      }
      if (editPlan) {
        await maintenancePlanService.update(editPlan.id, payload)
        toast.success('Plano atualizado!')
      } else {
        await maintenancePlanService.create(payload)
        toast.success('Plano criado!')
      }
      setShowPlanModal(false)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro ao salvar') }
  }

  const deletePlan = async (p: MaintenancePlan) => {
    if (!confirm(`Desativar plano "${p.name}"?`)) return
    try {
      await maintenancePlanService.delete(p.id)
      toast.success('Plano desativado')
      load()
    } catch { toast.error('Erro ao excluir') }
  }

  const toggleExpand = (id: number) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const openAddTask = (plan: MaintenancePlan) => {
    setActivePlan(plan)
    setEditTask(null)
    const nextSeq = (plan.tasks?.length ?? 0) + 1
    taskForm.reset({ sequence: nextSeq.toString(), description: '', estimated_minutes: '30' })
    setShowTaskModal(true)
  }

  const openEditTask = (plan: MaintenancePlan, task: MaintenancePlanTask) => {
    setActivePlan(plan)
    setEditTask(task)
    taskForm.reset({
      sequence: task.sequence.toString(),
      description: task.description,
      estimated_minutes: task.estimated_minutes.toString(),
    })
    setShowTaskModal(true)
  }

  const onSubmitTask = async (data: TaskForm) => {
    if (!activePlan) return
    try {
      const payload = {
        sequence: parseInt(data.sequence),
        description: data.description,
        estimated_minutes: parseInt(data.estimated_minutes),
      }
      if (editTask) {
        await maintenancePlanService.updateTask(activePlan.id, editTask.id, payload)
        toast.success('Tarefa atualizada!')
      } else {
        await maintenancePlanService.createTask(activePlan.id, payload)
        toast.success('Tarefa adicionada!')
      }
      setShowTaskModal(false)
      load()
    } catch (e: any) { toast.error(e?.response?.data?.error ?? 'Erro ao salvar') }
  }

  const deleteTask = async (plan: MaintenancePlan, task: MaintenancePlanTask) => {
    if (!confirm(`Remover tarefa "${task.description}"?`)) return
    try {
      await maintenancePlanService.deleteTask(plan.id, task.id)
      toast.success('Tarefa removida')
      load()
    } catch { toast.error('Erro ao remover tarefa') }
  }

  const FREQ_OPTIONS: FrequencyType[] = ['daily','weekly','monthly','hours']
  const PRIORITY_OPTIONS: Priority[]  = ['low','medium','high','critical']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Planos de Manutenção Preventiva</h1>
          <p className="text-gray-500 text-sm mt-0.5">Defina rotinas, frequências e tarefas de manutenção</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={15} /></button>
          <button onClick={openCreatePlan} className="btn-primary btn-sm"><Plus size={15} />Novo Plano</button>
        </div>
      </div>

      {/* Lista de planos */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : plans.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <ListChecks size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum plano cadastrado. Crie o primeiro!</p>
          </div>
        ) : plans.map(plan => {
          const isOpen = expanded.includes(plan.id)
          return (
            <div key={plan.id} className="card overflow-hidden">
              {/* Header do plano */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(plan.id)}
              >
                <button className="text-gray-400">
                  {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{plan.code}</span>
                    <span className="font-semibold text-gray-800">{plan.name}</span>
                    <span className={`badge ${PRIORITY_COLORS[plan.priority]}`}>{PRIORITY_LABELS[plan.priority]}</span>
                    <span className="badge bg-purple-100 text-purple-700">
                      {FREQUENCY_LABELS[plan.frequency_type]} / {plan.frequency_value}
                    </span>
                    {!plan.active && <span className="badge bg-gray-100 text-gray-400">Inativo</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {plan.asset_name} · {plan.estimated_hours}h estimadas · {plan.tasks?.length ?? 0} tarefa(s)
                  </p>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEditPlan(plan)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deletePlan(plan)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Tarefas */}
              {isOpen && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-600">Tarefas do Plano</h4>
                    <button onClick={() => openAddTask(plan)} className="btn-primary btn-sm text-xs">
                      <Plus size={13} />Adicionar Tarefa
                    </button>
                  </div>
                  {(!plan.tasks || plan.tasks.length === 0) ? (
                    <p className="text-sm text-gray-400 italic">Nenhuma tarefa cadastrada.</p>
                  ) : (
                    <div className="space-y-1">
                      {plan.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100 group">
                          <span className="text-xs font-mono text-gray-400 w-6 text-center">{task.sequence}</span>
                          <span className="flex-1 text-sm text-gray-700">{task.description}</span>
                          <span className="text-xs text-gray-400">{task.estimated_minutes} min</span>
                          <div className="hidden group-hover:flex gap-1">
                            <button onClick={() => openEditTask(plan, task)} className="p-1 hover:bg-blue-50 text-blue-500 rounded">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => deleteTask(plan, task)} className="p-1 hover:bg-red-50 text-red-500 rounded">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="text-xs text-gray-400 pt-1 pl-9">
                        Total estimado: {plan.tasks.reduce((s, t) => s + t.estimated_minutes, 0)} min
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Plano */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">{editPlan ? 'Editar Plano' : 'Novo Plano de Manutenção'}</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={planForm.handleSubmit(onSubmitPlan)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código *</label>
                  <input className="input" placeholder="PM-001" {...planForm.register('code', { required: true })} />
                </div>
                <div>
                  <label className="label">Prioridade *</label>
                  <select className="input" {...planForm.register('priority', { required: true })}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nome *</label>
                <input className="input" {...planForm.register('name', { required: true })} />
              </div>
              <div>
                <label className="label">Ativo vinculado *</label>
                <select className="input" {...planForm.register('asset_id', { required: true })}>
                  <option value="">Selecione o ativo...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {'  '.repeat(a.level - 1)}{a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Conta de Custo</label>
                <select className="input" {...planForm.register('account_id')}>
                  <option value="">Nenhuma</option>
                  {accounts.filter(a => a.type === 'analytical').map(a => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Frequência</label>
                  <select className="input" {...planForm.register('frequency_type')}>
                    {FREQ_OPTIONS.map(f => <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">A cada</label>
                  <input type="number" min="1" className="input" {...planForm.register('frequency_value')} />
                </div>
                <div>
                  <label className="label">Horas estimadas</label>
                  <input type="number" step="0.5" min="0" className="input" {...planForm.register('estimated_hours')} />
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea className="input" rows={2} {...planForm.register('description')} />
              </div>
              {editPlan && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...planForm.register('active')} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Plano ativo</span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tarefa */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editTask ? 'Editar Tarefa' : 'Adicionar Tarefa'}</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sequência</label>
                  <input type="number" min="1" className="input" {...taskForm.register('sequence', { required: true })} />
                </div>
                <div>
                  <label className="label">Tempo estimado (min)</label>
                  <input type="number" min="0" className="input" {...taskForm.register('estimated_minutes')} />
                </div>
              </div>
              <div>
                <label className="label">Descrição da Tarefa *</label>
                <textarea className="input" rows={3}
                  placeholder="Ex: Verificar nível de óleo, limpar filtros..."
                  {...taskForm.register('description', { required: true })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
