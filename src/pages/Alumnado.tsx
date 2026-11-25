import clsx from 'clsx'
import { LayoutGrid, List, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'

export function Alumnado() {
  const { t } = useI18n()
  const { alumnos, curso } = useStore()
  const [q, setQ] = useState('')
  const [grid, setGrid] = useState(true)
  const lista = alumnos.filter((a) => `${a.nombre} ${a.apellidos}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHeader
        title={t.alumnado}
        right={
          <button
            onClick={() => setGrid((g) => !g)}
            aria-label="Vista"
            className="rounded-lg p-2 text-muted hover:bg-surface"
          >
            {grid ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        }
      />
      <div className="mx-auto max-w-3xl px-4 pt-3">
        <div className="mb-1 text-sm text-muted">
          {curso.anyo} · {curso.grupos.join(', ')} · {alumnos.length}
        </div>
        <label className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <Search size={18} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.buscar}
            className="h-11 w-full bg-transparent text-base outline-none"
          />
        </label>
        <ul className={clsx(grid ? 'grid grid-cols-3 gap-3 sm:grid-cols-4' : 'rounded-2xl border border-line bg-surface')}>
          {lista.map((a) => (
            <li key={a.id} className={clsx(!grid && 'border-b border-line last:border-0')}>
              <Link
                to={`/alumnado/${a.id}`}
                className={clsx(
                  grid
                    ? 'flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center'
                    : 'flex items-center gap-3 px-4 py-2.5',
                )}
              >
                <Avatar nombre={a.nombre} apellidos={a.apellidos} size={grid ? 52 : 36} />
                <span className={clsx(grid ? 'text-sm font-medium leading-tight' : 'font-medium')}>
                  {a.nombre}
                  {!grid && <span className="font-normal text-muted"> {a.apellidos}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
