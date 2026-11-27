// Cursos escolares: crear el curso siguiente (pasa a ser el activo), cambiar el activo y editar sus grupos.
// El alumnado puede pasar al curso nuevo conservando su ficha e historial.
import clsx from 'clsx'
import { CalendarRange, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Campo, claseInput, Hoja } from '../components/Hoja'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { CursoEscolar } from '../data/types'
import { useI18n } from '../lib/i18n'

function siguienteAnyo(cursos: CursoEscolar[]) {
  const inicio = Math.max(...cursos.map((c) => Number(c.anyo.slice(0, 4))).filter(Number.isFinite), new Date().getFullYear() - 1)
  return `${inicio + 1}-${String(inicio + 2).slice(2)}`
}

function FormCurso({ curso, onClose }: { curso?: CursoEscolar; onClose: () => void }) {
  const { t } = useI18n()
  const { cursos, alumnosActivos, guardarCurso, activarCurso, moverAlumnos } = useStore()
  const [anyo, setAnyo] = useState(curso?.anyo ?? siguienteAnyo(cursos))
  const [grupos, setGrupos] = useState(curso?.grupos.join(', ') ?? '')
  const [tutor, setTutor] = useState(curso?.tutor ?? cursos.find((c) => c.estado === 'activo')?.tutor ?? '')
  const [pasar, setPasar] = useState(!curso && alumnosActivos.length > 0)
  const [grupoNuevo, setGrupoNuevo] = useState('')
  const lista = grupos.split(',').map((g) => g.trim()).filter(Boolean)
  return (
    <Hoja
      titulo={curso ? t.editar : t.cursoNuevo}
      onClose={onClose}
      puedeGuardar={anyo.trim() !== ''}
      onGuardar={() => {
        if (curso) {
          guardarCurso({ ...curso, anyo: anyo.trim(), grupos: lista, tutor: tutor.trim() || undefined })
        } else {
          const id = crypto.randomUUID()
          guardarCurso({ id, anyo: anyo.trim(), grupos: lista, estado: 'archivado', tutor: tutor.trim() || undefined })
          if (pasar) moverAlumnos(alumnosActivos.map((a) => a.id), id, grupoNuevo.trim() || undefined)
          activarCurso(id)
        }
        onClose()
      }}
    >
      <Campo label={t.cursoNombre}>
        <input autoFocus value={anyo} onChange={(e) => setAnyo(e.target.value)} className={claseInput} />
      </Campo>
      <Campo label={t.grupos} ayuda={t.separarComasGrupos}>
        <input value={grupos} onChange={(e) => setGrupos(e.target.value)} className={claseInput} />
      </Campo>
      <Campo label={t.pdfDocente}>
        <input value={tutor} onChange={(e) => setTutor(e.target.value)} className={claseInput} />
      </Campo>
      {!curso && alumnosActivos.length > 0 && (
        <>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" checked={pasar} onChange={(e) => setPasar(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
            <span>{t.pasarAlumnado} ({alumnosActivos.length})</span>
          </label>
          {pasar && (
            <Campo label={t.grupoNuevo}>
              <input list="grupos-nuevos" value={grupoNuevo} onChange={(e) => setGrupoNuevo(e.target.value)} className={claseInput} />
              <datalist id="grupos-nuevos">{lista.map((g) => <option key={g} value={g} />)}</datalist>
            </Campo>
          )}
        </>
      )}
    </Hoja>
  )
}

export function Cursos() {
  const { t } = useI18n()
  const { cursos, alumnos, activarCurso } = useStore()
  const [editando, setEditando] = useState<CursoEscolar | 'nuevo'>()
  const ordenados = [...cursos].sort((a, b) => b.anyo.localeCompare(a.anyo))
  return (
    <>
      <PageHeader
        title={t.cursos}
        icon={CalendarRange}
        right={
          <button
            onClick={() => setEditando('nuevo')}
            aria-label={t.cursoNuevo}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t.cursoNuevo}</span>
          </button>
        }
      />
      <div className="mx-auto max-w-3xl space-y-3 px-4 pt-4">
        {ordenados.map((c) => {
          const n = alumnos.filter((a) => a.cursoId === c.id && a.estado === 'activo').length
          return (
            <Card key={c.id} className={clsx('flex items-center gap-3 p-4', c.estado === 'activo' && 'border-accent')}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tabular-nums">{c.anyo}</span>
                  {c.estado === 'activo' && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">{t.activo}</span>}
                </div>
                <p className="text-sm text-muted">{[c.grupos.join(', '), `${n} ${t.alumnosN.toLowerCase()}`].filter(Boolean).join(' · ')}</p>
              </div>
              {c.estado !== 'activo' && (
                <button onClick={() => activarCurso(c.id)} className="min-h-10 rounded-xl border border-line px-3 text-sm">{t.activar}</button>
              )}
              <button onClick={() => setEditando(c)} aria-label={t.editar} className="rounded-lg p-2 text-muted hover:bg-bg">
                <Pencil size={16} />
              </button>
            </Card>
          )
        })}
      </div>
      {editando && <FormCurso curso={editando === 'nuevo' ? undefined : editando} onClose={() => setEditando(undefined)} />}
    </>
  )
}
