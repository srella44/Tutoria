import clsx from 'clsx'
import { BriefcaseBusiness, LayoutGrid, List, Plus, Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormAlumno } from '../components/Formularios'
import { Avatar, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'

export function Alumnado() {
  const { t } = useI18n()
  const { alumnos, alumnosActivos, curso } = useStore()
  const [q, setQ] = useState('')
  const [grid, setGrid] = useState(true)
  const [verArchivados, setVerArchivados] = useState(false)
  const [alta, setAlta] = useState(false)
  const archivados = alumnos.filter((a) => a.estado === 'archivado' && a.cursoId === curso.id)
  const base = verArchivados ? archivados : alumnosActivos
  const lista = base.filter((a) => `${a.nombre} ${a.apellidos}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <PageHeader
        title={t.alumnado}
        icon={Users}
        right={
          <>
            <Link to="/profesionales" aria-label={t.profesionales} title={t.profesionales} className="rounded-lg p-2 text-muted hover:bg-bg">
              <BriefcaseBusiness size={20} />
            </Link>
            <button onClick={() => setGrid((g) => !g)} aria-label="Vista" className="rounded-lg p-2 text-muted hover:bg-bg">
              {grid ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>
            <button
              onClick={() => setAlta(true)}
              aria-label={t.alumnoNuevo}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
            >
              <Plus size={16} /> <span className="hidden sm:inline">{t.alumnoNuevo}</span>
            </button>
          </>
        }
      />
      <div className="mx-auto max-w-3xl px-4 pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{[curso.anyo, ...curso.grupos, String(alumnosActivos.length)].join(' · ')}</span>
          {archivados.length > 0 && (
            <button
              onClick={() => setVerArchivados((v) => !v)}
              className={clsx('ml-auto rounded-full border px-3 py-1', verArchivados ? 'border-accent bg-accent-soft text-accent' : 'border-line')}
            >
              {t.archivados} · {archivados.length}
            </button>
          )}
        </div>

        {base.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
            <Users size={36} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 text-muted">{t.sinAlumnos}</p>
            <button
              onClick={() => setAlta(true)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-on-accent"
            >
              <Plus size={18} /> {t.alumnoNuevo}
            </button>
          </div>
        ) : (
          <>
            <label className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3">
              <Search size={18} className="text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.buscar}
                className="h-11 w-full bg-transparent text-base outline-none"
              />
            </label>
            <ul className={clsx(grid ? 'grid grid-cols-3 gap-3 sm:grid-cols-4' : 'panel-app rounded-2xl border border-line bg-surface')}>
              {lista.map((a) => (
                <li key={a.id} className={clsx(!grid && 'border-b border-line last:border-0')}>
                  <Link
                    to={`/alumnado/${a.id}`}
                    className={clsx(
                      grid
                        ? 'flex flex-col items-center gap-2 panel-app rounded-2xl border border-line bg-surface p-3 text-center hover:border-accent'
                        : 'flex items-center gap-3 px-4 py-2.5',
                      verArchivados && 'opacity-70',
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
          </>
        )}
      </div>
      {alta && <FormAlumno onClose={() => setAlta(false)} />}
    </>
  )
}
