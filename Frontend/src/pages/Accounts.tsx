import { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { accountService } from '../services/account.service'
import TreeNode from '../components/common/TreeNode'
import type { Account, AccountType, AccountNature } from '../types'

type FormData = {
  code: string; name: string
  type: AccountType; nature: AccountNature
  parent_id: string; active: boolean
}

export default function Accounts() {
  const [tree, setTree]           = useState<Account[]>([])
  const [selected, setSelected]   = useState<Account | null>(null)
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState<Account | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const load = async () => {
    setLoading(true)
    try { setTree(await accountService.getTree()) }
    catch { toast.error('Erro ao carregar contas') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = (parent?: Account) => {
    setEditItem(null)
    reset({ code:'', name:'', type:'analytical', nature:'debit', parent_id: parent?.id?.toString() ?? '', active: true })
    setShowModal(true)
  }

  const openEdit = (node: Account) => {
    setEditItem(node)
    reset({
      code: node.code, name: node.name, type: node.type,
      nature: node.nature, parent_id: node.parent_id?.toString() ?? '', active: node.active,
    })
    setShowModal(true)
  }

  const onDelete = async (node: Account) => {
    if (!confirm(`Desativar conta "${node.code} - ${node.name}"?`)) return
    try {
      await accountService.delete(node.id)
      toast.success('Conta desativada')
      load()
    } catch { toast.error('Erro ao excluir conta') }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, parent_id: data.parent_id ? parseInt(data.parent_id) : null }
      if (editItem) {
        await accountService.update(editItem.id, payload)
        toast.success('Conta atualizada!')
      } else {
        await accountService.create(payload)
        toast.success('Conta criada!')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Erro ao salvar')
    }
  }

  const TYPE_LABEL: Record<AccountType, string>   = { synthetic: 'Sintética', analytical: 'Analítica' }
  const NATURE_LABEL: Record<AccountNature, string> = { debit: 'Débito', credit: 'Crédito' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plano de Contas Gerencial</h1>
          <p className="text-gray-500 text-sm mt-0.5">Estrutura contábil para rateio de custos de manutenção</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={15} /></button>
          <button onClick={() => openCreate()} className="btn-primary btn-sm"><Plus size={15} />Nova Conta Raiz</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Árvore */}
        <div className="lg:col-span-2 card p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-center py-12 text-gray-400">Nenhuma conta cadastrada</p>
          ) : (
            <div className="space-y-0.5">
              {tree.map(node => (
                <TreeNode
                  key={node.id}
                  node={node as any}
                  selected={selected?.id}
                  onSelect={(n) => setSelected(n as Account)}
                  onEdit={(n) => openEdit(n as Account)}
                  onDelete={(n) => onDelete(n as Account)}
                  onAddChild={(n) => openCreate(n as Account)}
                  renderBadge={(n) => {
                    const a = n as Account
                    return (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${a.type === 'synthetic' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {TYPE_LABEL[a.type]}
                      </span>
                    )
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detalhe */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Detalhes da Conta</h3>
          {selected ? (
            <dl className="space-y-3 text-sm">
              {[
                ['Código', selected.code],
                ['Nome', selected.name],
                ['Tipo', TYPE_LABEL[selected.type]],
                ['Natureza', NATURE_LABEL[selected.nature]],
                ['Nível', selected.level],
                ['Situação', selected.active ? '✓ Ativa' : '✗ Inativa'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-gray-400 text-xs uppercase tracking-wide">{k}</dt>
                  <dd className="text-gray-800 mt-0.5">{v}</dd>
                </div>
              ))}
              <div className="pt-3 flex gap-2">
                <button onClick={() => openEdit(selected)} className="btn-secondary btn-sm flex-1 justify-center">Editar</button>
                <button onClick={() => openCreate(selected)} className="btn-primary btn-sm flex-1 justify-center">+ Sub-conta</button>
              </div>
            </dl>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Selecione uma conta na árvore</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editItem ? 'Editar Conta' : 'Nova Conta'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código *</label>
                  <input className="input" placeholder="ex: 1.2.3" {...register('code', { required: 'Obrigatório' })} />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" {...register('type')}>
                    <option value="synthetic">Sintética</option>
                    <option value="analytical">Analítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nome *</label>
                <input className="input" {...register('name', { required: 'Obrigatório' })} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Natureza *</label>
                <select className="input" {...register('nature')}>
                  <option value="debit">Débito</option>
                  <option value="credit">Crédito</option>
                </select>
              </div>
              {editItem && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('active')} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Conta ativa</span>
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
