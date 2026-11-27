import clsx from 'clsx'
import { ArrowDown, ArrowUp, ArrowUpDown, BookHeart, BriefcaseBusiness, LayoutGrid, List, Plus, Search, SquareCheckBig, Upload, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MarcadoRapido } from '../components/Autorizaciones'
import { FormAlumno } from '../components/Formularios'
import { Avatar, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'

export function Alumnado() {
  const { t } = useI18n()
  const { alumnos, alumnosActivos, curso, ordenarAlumnos } = useStore()
  const [q, setQ] = useState('')
  const [grid, setGrid] = useState(true)
  const [verArchivados, setVerArchivados] = useState(false)
  const [alta, setAlta] = useState(false)
  const [ordenando, setOrdenando] = useState(false)
  const [marcandoReligion, setMarcandoReligion] = useState(false)
  const [soloReligion, setSoloReligion] = useState(false)
  const nReligion = alumnosActivos.filter((a) => a.religion).length
  const ids = alumnosActivos.map((a) => a.id)
  const mover = (i: number, delta: -1 | 1) => {
    const j = i + delta
    if (j < 0 || j >= ids.length) return
    const copia = [...ids]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    ordenarAlumnos(copia)
  }
  const ordenarPor = (clave: (a: (typeof alumnosActivos)[number]) => string | number) =>
    ordenarAlumnos([...alumnosActivos]
      .sort((x, y) => { const a = clave(x), b = clave(y); return typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)) })
      .map((a) => a.id))
  const archivados = alumnos.filter((a) => a.estado === 'archivado' && a.cursoId === curso.id)
  const base = verArchivados ? archivados : alumnosActivos
  const lista = base.filter((a) => `${a.nombre} ${a.apellidos}`.toLowerCase().includes(q.toLowerCase()) && (!soloReligion || a.religion))

  return (
    <>
      <PageHeader
        title={t.alumnado}
        icon={Users}
        right={
          <>
            <Link to="/importar" aria-label={t.importarTitulo} title={t.importarTitulo} className="rounded-lg p-2 text-muted hover:bg-bg">
              <Upload size={20} />
            </Link>
            <Link to="/profesionales" aria-label={t.profesionales} title={t.profesionales} className="rounded-lg p-2 text-muted hover:bg-bg">
              <BriefcaseBusiness size={20} />
            </Link>
            {alumnosActivos.length > 1 && (
              <button
                onClick={() => { setOrdenando((o) => !o); setMarcandoReligion(false); setVerArchivados(false) }}
                aria-label={t.ordenar}
                title={t.ordenar}
                className={clsx('rounded-lg p-2 hover:bg-bg', ordenando ? 'bg-accent-soft text-accent' : 'text-muted')}
              >
                <ArrowUpDown size={20} />
              </button>
            )}
            {alumnosActivos.length > 0 && (
              <button
                onClick={() => { setMarcandoReligion((o) => !o); setOrdenando(false); setVerArchivados(false) }}
                aria-label={t.marcar}
                title={t.marcar}
                className={clsx('rounded-lg p-2 hover:bg-bg', marcandoReligion ? 'bg-accent-soft text-accent' : 'text-muted')}
              >
                <SquareCheckBig size={20} />
              </button>
            )}
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
          {nReligion > 0 && !ordenando && !marcandoReligion && !verArchivados && (
            <button
              onClick={() => setSoloReligion((v) => !v)}
              aria-pressed={soloReligion}
              className={clsx('flex items-center gap-1 rounded-full border px-3 py-1', soloReligion ? 'border-accent bg-accent-soft text-accent' : 'border-line')}
            >
              <BookHeart size={14} aria-hidden /> {t.religion} · {nReligion}
            </button>
          )}
          {archivados.length > 0 && (
            <button
              onClick={() => setVerArchivados((v) => !v)}
              className={clsx('ml-auto rounded-full border px-3 py-1', verArchivados ? 'border-accent bg-accent-soft text-accent' : 'border-line')}
            >
              {t.archivados} · {archivados.length}
            </button>
          )}
        </div>

        {marcandoReligion ? (
          <MarcadoRapido onHecho={() => setMarcandoReligion(false)} />
        ) : ordenando ? (
          <>
            <p className="mb-2 text-sm text-muted">{t.ordenAyuda}</p>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">{t.ordenarPor}:</span>
              <button onClick={() => ordenarPor((a) => `${a.nombre} ${a.apellidos}`)} className="rounded-full border border-line px-3 py-1">{t.porNombre}</button>
              <button onClick={() => ordenarPor((a) => `${a.apellidos} ${a.nombre}`)} className="rounded-full border border-line px-3 py-1">{t.porApellidos}</button>
              {alumnosActivos.some((a) => a.numeroLista !== undefined) && (
                <button onClick={() => ordenarPor((a) => a.numeroLista ?? Infinity)} className="rounded-full border border-line px-3 py-1">{t.porNumero}</button>
              )}
              <button onClick={() => setOrdenando(false)} className="ml-auto rounded-full bg-accent px-4 py-1.5 font-semibold text-on-accent">{t.hecho}</button>
            </div>
            <ol className="panel-app rounded-2xl border border-line bg-surface">
              {alumnosActivos.map((a, i) => (
                <li key={a.id} className="flex items-center gap-2 border-b border-line py-1.5 pr-2 pl-4 last:border-0">
                  <span className="w-6 text-sm text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{a.nombre}</span> <span className="text-muted">{a.apellidos}</span>
                  </span>
                  <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label={`${t.subir} ${a.nombre}`} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-bg disabled:opacity-30">
                    <ArrowUp size={18} />
                  </button>
                  <button onClick={() => mover(i, 1)} disabled={i === alumnosActivos.length - 1} aria-label={`${t.bajar} ${a.nombre}`} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-bg disabled:opacity-30">
                    <ArrowDown size={18} />
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : base.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center">
            <Users size={36} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 text-muted">{t.sinAlumnos}</p>
            <button
              onClick={() => setAlta(true)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-on-accent"
            >
              <Plus size={18} /> {t.alumnoNuevo}
            </button>
            <Link to="/importar" className="mt-2 ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 font-semibold text-accent">
              <Upload size={18} /> {t.importarTitulo}
            </Link>
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
