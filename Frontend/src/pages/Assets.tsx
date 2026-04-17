import { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { assetService } from '../services/asset.service'
import TreeNode from '../components/common/TreeNode'
import type { Asset, AssetType } from '../types'
import { ASSET_TYPE_LABELS } from '../types'

type FormData = {
  code: string; name: string; description: string
  type: AssetType; parent_id: string; active: boolean
}

const ASSET_TYPES: AssetType[] = ['plant','area','system','subsystem','equipment','component']

export default function Assets() {
  const [tree, setTree]           = useState<Asset[]>([])
  const [selected, setSelected]   = useState<Asset | null>(null)
  const [loading, setLoading]     = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem]   = useState<Asset | null>(null)
  const [parentId, setParentId]   = useState<number | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>()

  const load = async () => {
    setLoading(true)
    try { setTree(await assetService.getTree()) }
    catch { toast.error('Erro ao carregar ativos') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = (parent?: Asset) => {
    setEditItem(null)
    setParentId(parent?.id ?? null)
    reset({ code:'', name:'', description:'', type:'equipment', parent_id: parent?.id?.toString() ?? '', active: true })
    setShowModal(true)
  }

  const openEdit = (node: Asset) => {
    setEditItem(node)
    setParentId(node.parent_id)
    reset({
      code: node.code, name: node.name, description: node.description,
      type: node.type, parent_id: node.parent_id?.toString() ?? '', active: node.active,
    })
    setShowModal(true)
  }

  const onDelete = async (node: Asset) => {
    if (!confirm(`Deseja desativar o ativo "${node.name}"?`)) return
    try {
      await assetService.delete(node.id)
      toast.success('Ativo desativado')
      load()
    } catch { toast.error('Erro ao excluir ativo') }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        parent_id: data.parent_id ? parseInt(data.parent_id) : null,
      }
      if (editItem) {
        await assetService.update(editItem.id, payload)
        toast.success('Ativo atualizado!')
      } else {
        await assetService.create(payload)
        toast.success('Ativo criado!')
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
          <h1 className="text-2xl font-bold text-gray-800">Ativos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Hierarquia de objetos industriais (até 15 níveis)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={15} /></button>
          <button onClick={() => openCreate()} className="btn-primary btn-sm"><Plus size={15} />Novo Ativo Raiz</button>
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
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Nenhum ativo cadastrado</p>
              <p className="text-sm mt-1">Clique em "Novo Ativo Raiz" para começar</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map(node => (
                <TreeNode
                  key={node.id}
                  node={node as any}
                  selected={selected?.id}
                  onSelect={(n) => setSelected(n as Asset)}
                  onEdit={(n) => openEdit(n as Asset)}
                  onDelete={(n) => onDelete(n as Asset)}
                  onAddChild={(n) => openCreate(n as Asset)}
                  renderBadge={(n) => (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {ASSET_TYPE_LABELS[(n as Asset).type]}
                    </span>
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detalhe */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Detalhes do Ativo</h3>
          {selected ? (
            <dl className="space-y-3 text-sm">
              {[
                ['Código', selected.code],
                ['Nome', selected.name],
                ['Tipo', ASSET_TYPE_LABELS[selected.type]],
                ['Nível', selected.level],
                ['Descrição', selected.description || '—'],
                ['Situação', selected.active ? '✓ Ativo' : '✗ Inativo'],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-gray-400 text-xs uppercase tracking-wide">{k}</dt>
                  <dd className="text-gray-800 mt-0.5">{v}</dd>
                </div>
              ))}
              <div className="pt-3 flex gap-2">
                <button onClick={() => openEdit(selected)} className="btn-secondary btn-sm flex-1 justify-center">Editar</button>
                <button onClick={() => openCreate(selected)} className="btn-primary btn-sm flex-1 justify-center">+ Filho</button>
              </div>
            </dl>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Selecione um ativo na árvore</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editItem ? 'Editar Ativo' : 'Novo Ativo'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código *</label>
                  <input className="input" {...register('code', { required: 'Obrigatório' })} />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                </div>
                <div>
                  <label className="label">Tipo *</label>
                  <select className="input" {...register('type', { required: true })}>
                    {ASSET_TYPES.map(t => <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nome *</label>
                <input className="input" {...register('name', { required: 'Obrigatório' })} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea className="input" rows={2} {...register('description')} />
              </div>
              {editItem && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('active')} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Ativo</span>
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
