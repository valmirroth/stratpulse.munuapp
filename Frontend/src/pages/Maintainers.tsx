import { useState, useEffect } from 'react'
import { Plus, Search, RefreshCw, Pencil, Trash2, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { maintainerService } from '../services/maintainer.service'
import type { Maintainer } from '../types'

type FormData = Omit<Maintainer, 'id' | 'created_at' | 'updated_at'> & { hourly_rate: string }

const SPECIALTIES = [
  'Mecânica','Elétrica','Instrumentação','Civil','HVAC',
  'Hidráulica','Pneumática','Caldeiraria','Soldagem','Geral',
]

export default function Maintainers() {
  const [list, setList]           = useState<Maintainer[]>([])
  const [filtered, setFiltered]   = useState<Maintainer[]>([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState<Maintainer | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const load = async () => {
    setLoading(true)
    try {
      const data = await maintainerService.getAll()
      setList(data)
      setFiltered(data)
    } catch { toast.error('Erro ao carregar manutentores') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(list.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.registration.toLowerCase().includes(q) ||
      m.specialty.toLowerCase().includes(q)
    ))
  }, [search, list])

  const openCreate = () => {
    setEditItem(null)
    reset({ name:'', registration:'', specialty:'Geral', phone:'', email:'', hourly_rate: '0', active: true })
    setShowModal(true)
  }

  const openEdit = (m: Maintainer) => {
    setEditItem(m)
    reset({ ...m, hourly_rate: m.hourly_rate.toString() })
    setShowModal(true)
  }

  const onDelete = async (m: Maintainer) => {
    if (!confirm(`Desativar manutentor "${m.name}"?`)) return
    try {
      await maintainerService.delete(m.id)
      toast.success('Manutentor desativado')
      load()
    } catch { toast.error('Erro ao excluir') }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, hourly_rate: parseFloat(data.hourly_rate) || 0, user_id: null }
      if (editItem) {
        await maintainerService.update(editItem.id, payload)
        toast.success('Manutentor atualizado!')
      } else {
        await maintainerService.create(payload)
        toast.success('Manutentor cadastrado!')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao salvar')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manutentores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Cadastro da equipe de manutenção</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={15} /></button>
          <button onClick={openCreate} className="btn-primary btn-sm"><Plus size={15} />Novo Manutentor</button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Buscar por nome, matrícula ou especialidade..."
          className="input pl-9" value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Manutentor','Matrícula','Especialidade','Contato','Valor/h','Situação','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum manutentor encontrado</td></tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-full p-1.5 flex-shrink-0">
                        <User size={14} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-800">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">{m.registration}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-blue-50 text-blue-700">{m.specialty}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{m.phone || '—'}</div>
                    <div className="text-xs text-gray-400">{m.email || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {m.hourly_rate > 0 ? `R$ ${m.hourly_rate.toFixed(2)}/h` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${m.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(m)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Excluir">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} registro(s) encontrado(s)
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editItem ? 'Editar Manutentor' : 'Novo Manutentor'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Nome completo *</label>
                <input className="input" {...register('name', { required: 'Obrigatório' })} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Matrícula *</label>
                  <input className="input" {...register('registration', { required: 'Obrigatório' })} />
                  {errors.registration && <p className="text-red-500 text-xs mt-1">{errors.registration.message}</p>}
                </div>
                <div>
                  <label className="label">Especialidade *</label>
                  <select className="input" {...register('specialty', { required: true })}>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Telefone</label>
                  <input className="input" placeholder="(00) 00000-0000" {...register('phone')} />
                </div>
                <div>
                  <label className="label">Valor/hora (R$)</label>
                  <input type="number" step="0.01" min="0" className="input" {...register('hourly_rate')} />
                </div>
              </div>
              <div>
                <label className="label">E-mail</label>
                <input type="email" className="input" {...register('email')} />
              </div>
              {editItem && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('active')} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Manutentor ativo</span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
