import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, BookOpen, Users,
  ClipboardList, FileText, Clock, Settings, Wrench,
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { label: 'Dashboard',         to: '/dashboard',          icon: LayoutDashboard },
  { label: 'Ativos',            to: '/assets',             icon: GitBranch },
  { label: 'Plano de Contas',   to: '/accounts',           icon: BookOpen },
  { label: 'Manutentores',      to: '/maintainers',        icon: Users },
  { label: 'Planos Prev.',      to: '/maintenance-plans',  icon: ClipboardList },
  { label: 'Ordens de Serviço', to: '/work-orders',        icon: FileText },
  { label: 'Lançar Horas',      to: '/time-entries',       icon: Clock },
  { label: 'Usuários',          to: '/users',              icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="bg-blue-500 rounded-lg p-2">
          <Wrench size={20} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-none">ManuInd</p>
          <p className="text-gray-400 text-xs">Manutenção Industrial</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs text-center">v1.0.0 © 2025 ManuInd</p>
      </div>
    </aside>
  )
}
