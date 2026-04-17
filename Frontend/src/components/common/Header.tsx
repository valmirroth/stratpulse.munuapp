import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_LABELS = { admin: 'Administrador', manager: 'Gerente', maintainer: 'Manutentor' }

export default function Header() {
  const { user, logout } = useAuth()
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="bg-blue-100 rounded-full p-1.5">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800 leading-none">{user?.name}</p>
            <p className="text-gray-500 text-xs">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </header>
  )
}
