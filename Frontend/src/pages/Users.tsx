import { useState, useEffect } from 'react'
import { Users as UsersIcon, Plus, Search, Edit2, Trash2, Key, ShieldCheck, Shield, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/user.service'
import type { User } from '../types'
import toast from 'react-hot-toast'

const ROLE_LABELS: Record<string, string> = {
  admin:       'Administrador',
  manager:     'Gerente',
  maintainer:  'Manutentor',
}

const ROLE_COLORS: Record<string, string> = {
  admin:      'badge bg-purple-100 text-purple-700',
  manager:    'badge bg-blue-100 text-blue-700',
  maintainer: 'badge bg-teal-100 text-teal-700',
}

const ROLE_ICONS: Record<string, any> = {
  admin:      ShieldCheck,
  manager:    Shield,
  maintainer: User,
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: string
  active: boolean
}

const EMPTY_FORM: UserFormData = { name: '', email: '', password: '', role: 'maintainer', active: true }

interface PasswordFormData { current_password: string; new_password: string; confirm: string }

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Create / Edit modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState<User | null>(null)
  const [form, setForm]             = useState<UserFormData>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  // Password reset modal
  const [pwModal, setPwModal]       = useState(false)
  const [pwTarget, setPwTarget]     = useState<User | null>(null)
  const [pwForm, setPwForm]         = useState<PasswordFormData>({ current_password: '', new_password: '', confirm: '' })
  const [pwSaving, setPwSaving]     = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const isAdmin = me?.role === 'admin'

  const load = async () => {
    setLoading(true)
    try {
      setUsers(await userService.getAll())
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  /* ── Create / Edit ── */
  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active })
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return toast.error('Nome e e-mail são obrigatórios')
    if (!editing && !form.password) return toast.error('Senha obrigatória para novo usuário')

    setSaving(true)
    try {
      if (editing) {
        const payload: any = { name: form.name, email: form.email, role: form.role, active: form.active }
        await userService.update(editing.id, payload)
        toast.success('Usuário atualizado')
      } else {
        await userService.create({ name: form.name, email: form.email, password: form.password, role: form.role })
        toast.success('Usuário criado')
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete ── */
  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await userService.delete(deleteTarget.id)
      toast.success('Usuário removido')
      setDeleteTarget(null)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao remover')
    }
  }

  /* ── Password ── */
  function openPwModal(u: User) {
    setPwTarget(u)
    setPwForm({ current_password: '', new_password: '', confirm: '' })
    setPwModal(true)
  }

  async function handlePwSave(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return toast.error('As senhas não coincidem')
    if (pwForm.new_password.length < 6) return toast.error('Senha deve ter ao menos 6 caracteres')
    setPwSaving(true)
    try {
      // Uses the auth/password endpoint which changes the logged-in user's password.
      // Admins resetting other users' passwords would need a separate endpoint — for now
      // only show this for the current user's own password.
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('manuind_token')}`,
        },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Erro')
      }
      toast.success('Senha alterada com sucesso')
      setPwModal(false)
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao alterar senha')
    } finally {
      setPwSaving(false)
    }
  }

  /* ── UI ── */
  const activeCount   = users.filter(u => u.active).length
  const adminCount    = users.filter(u => u.role === 'admin').length
  const managerCount  = users.filter(u => u.role === 'manager').length
  const maintCount    = users.filter(u => u.role === 'maintainer').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Gerencie os acessos ao sistema</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary btn-sm">
            <Plus size={16} /> Novo Usuário
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Usuários Ativos', value: activeCount,   color: 'bg-blue-500' },
          { label: 'Administradores', value: adminCount,    color: 'bg-purple-500' },
          { label: 'Gerentes',        value: managerCount,  color: 'bg-blue-400' },
          { label: 'Manutentores',    value: maintCount,    color: 'bg-teal-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`${color} rounded-xl p-3 flex-shrink-0`}>
              <UsersIcon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9 w-full"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-40"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">Todos os perfis</option>
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="maintainer">Manutentor</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-12 animate-pulse bg-gray-100 rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Nenhum usuário encontrado</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Perfil</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => {
                  const RoleIcon = ROLE_ICONS[u.role] ?? User
                  const isSelf = u.id === me?.id
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {u.name}
                              {isSelf && <span className="ml-2 text-xs text-blue-500 font-normal">(você)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={ROLE_COLORS[u.role] ?? 'badge'}>
                          <RoleIcon size={11} className="inline mr-1" />
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Password change — only for self (anyone) or admin resetting others */}
                          {isSelf && (
                            <button
                              onClick={() => openPwModal(u)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Alterar senha"
                            >
                              <Key size={15} />
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEdit(u)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={15} />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => setDeleteTarget(u)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Nome completo</label>
                <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input w-full" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              {!editing && (
                <div>
                  <label className="label">Senha inicial</label>
                  <input className="input w-full" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" />
                </div>
              )}
              <div>
                <label className="label">Perfil de acesso</label>
                <select className="input w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="maintainer">Manutentor</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {editing && (
                <div className="flex items-center gap-3">
                  <input
                    id="active-toggle"
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="active-toggle" className="text-sm text-gray-700">Usuário ativo</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Password Modal ── */}
      {pwModal && pwTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Alterar Senha</h2>
              <button onClick={() => setPwModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handlePwSave} className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Alterando senha de <strong className="text-gray-700">{pwTarget.name}</strong></p>
              <div>
                <label className="label">Senha atual</label>
                <input className="input w-full" type="password" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Nova senha</label>
                <input className="input w-full" type="password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required minLength={6} />
              </div>
              <div>
                <label className="label">Confirmar nova senha</label>
                <input className="input w-full" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPwModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={pwSaving} className="btn-primary flex-1">
                  {pwSaving ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Confirmar remoção</h2>
            <p className="text-sm text-gray-500 mb-6">
              Deseja remover o usuário <strong className="text-gray-700">{deleteTarget.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
