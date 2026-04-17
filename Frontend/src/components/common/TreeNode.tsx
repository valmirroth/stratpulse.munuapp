import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export interface TreeItem {
  id: number
  code: string
  name: string
  type?: string
  level: number
  active: boolean
  children?: TreeItem[]
  [key: string]: unknown
}

interface Props {
  node: TreeItem
  onSelect?: (node: TreeItem) => void
  onEdit?: (node: TreeItem) => void
  onDelete?: (node: TreeItem) => void
  onAddChild?: (node: TreeItem) => void
  selected?: number | null
  renderBadge?: (node: TreeItem) => React.ReactNode
}

export default function TreeNode({ node, onSelect, onEdit, onDelete, onAddChild, selected, renderBadge }: Props) {
  const [open, setOpen] = useState(node.level <= 2)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className={clsx(
          'flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer group transition-colors',
          selected === node.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
        )}
        style={{ paddingLeft: `${(node.level - 1) * 20 + 8}px` }}
        onClick={() => onSelect?.(node)}
      >
        {/* Toggle */}
        <button
          className="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        >
          {hasChildren
            ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
            : <span className="w-1 h-1 rounded-full bg-gray-300 inline-block" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400 flex-shrink-0">{node.code}</span>
          <span className={clsx('text-sm truncate', !node.active && 'text-gray-400 line-through')}>
            {node.name}
          </span>
          {renderBadge?.(node)}
        </div>

        {/* Actions */}
        <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
          {onAddChild && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild(node) }}
              className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
              title="Adicionar filho"
            >+</button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(node) }}
              className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >Editar</button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node) }}
              className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >Excluir</button>
          )}
        </div>
      </div>

      {open && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              selected={selected}
              renderBadge={renderBadge}
            />
          ))}
        </div>
      )}
    </div>
  )
}
