// Listado y alta de amassades del alumnado o sesiones internas del centro.
import clsx from 'clsx'
import { Building2, CalendarPlus, Handshake, ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DocumentosClaustre } from '../components/DocumentosClaustre'
import { EstadoCita } from '../components/EstadoCita'
import { Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre, tiposAmassada, tiposClaustre, type Registro, type TipoRegistro } from '../data/types'
import { descargarCalendario } from '../lib/calendario'
import { diaLocal, fechaCorta, hora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Reuniones({ claustre = false }: { claustre?: boolean }) {
  const { t, lang, tipo } = useI18n()
  const { registros, alumnos } = useStore()
  const [nueva, setNueva] = useState(false)
  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'

  const tiposReunion: readonly TipoRegistro[] = claustre ? tiposClaustre : tiposAmassada
  const tituloNueva = claustre ? t.nuevaSesion : t.nuevaReunion
  const [ahora] = useState(Date.now)
  const todas = registros.filter((r) => tiposReunion.includes(r.tipo))
  const pendientes = todas.filter((r) => !citaRealizada(r))
  const proximas = pendientes.filter((r) => Date.parse(r.fecha) >= ahora).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const atrasadas = pendientes.filter((r) => Date.parse(r.fecha) < ahora).sort((a, b) => b.fecha.localeCompare(a.fecha))
  const realizadas = todas.filter(citaRealizada).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const fila = (r: Registro) => (
    <li key={r.id} className="cita-fila flex flex-wrap items-center gap-x-2 border-b border-line p-2 last:border-0 sm:flex-nowrap">
      <Link to={`/reunion/${r.id}`} state={{ desdeTutoria: true }} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 hover:bg-bg">
        <div className="cita-fecha w-20 shrink-0 rounded-xl p-2 text-center" data-color={claustre ? 'azul' : 'lila'}>
          <div className="text-xs font-bold capitalize">{fechaCorta(r.fecha, lang)}</div>
          <div className="text-xs">{hora(r.fecha)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">{r.titulo || tipo[r.tipo]}</div>
          {!claustre && r.alumnoIds.length > 0 && <div className="truncate text-sm text-muted">{r.alumnoIds.map(nombre).join(', ')}</div>}
          {r.estado === 'sinFirmar' && <span className="block text-xs text-warn">{t.actasSinFirmar}</span>}
        </div>
        <ChevronRight size={17} className="hidden shrink-0 text-muted sm:block" aria-hidden />
      </Link>
      <EstadoCita cita={r} />
    </li>
  )

  return (
    <>
      <PageHeader
        title={claustre ? t.claustre : t.reuniones}
        icon={claustre ? Building2 : Handshake}
        color={claustre ? 'azul' : 'lila'}
        right={
          <>
            <button
              disabled={todas.length === 0}
              title={t.exportarCalendar}
              aria-label={t.exportarCalendar}
              onClick={() => descargarCalendario(todas, (r) => esClaustre(r.tipo) ? tipo[r.tipo] : t.eventoPrivado)}
              className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface disabled:opacity-50"
            >
              <CalendarPlus size={20} />
            </button>
            <button
              onClick={() => setNueva(true)}
              className="flex items-center gap-1 min-h-11 rounded-xl accion-coral px-3 text-sm font-semibold"
            >
              <Plus size={16} /> {tituloNueva}
            </button>
          </>
        }
      />
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle count={proximas.length}>{t.proximasN}</SectionTitle>
        <Card>{proximas.length === 0 ? <Empty>{t.nadaPendiente}</Empty> : <ul>{proximas.map(fila)}</ul>}</Card>
        {atrasadas.length > 0 && <>
          <SectionTitle count={atrasadas.length}>{t.citasPendientesPasadas}</SectionTitle>
          <Card><ul>{atrasadas.map(fila)}</ul></Card>
        </>}
        <SectionTitle count={realizadas.length}>{t.citasHechas}</SectionTitle>
        <Card>{realizadas.length === 0 ? <Empty>{t.sinRegistros}</Empty> : <ul>{realizadas.map(fila)}</ul>}</Card>
        {claustre && <DocumentosClaustre />}
      </div>
      {nueva && <NuevaReunion claustre={claustre} tituloNueva={tituloNueva} tiposReunion={tiposReunion} onClose={() => setNueva(false)} />}
    </>
  )
}

function NuevaReunion({ claustre, tiposReunion, tituloNueva, onClose }: {
  claustre: boolean
  tiposReunion: readonly TipoRegistro[]
  tituloNueva: string
  onClose: () => void
}) {
  const { t, tipo: tipoLabel } = useI18n()
  const { alumnos, addRegistro } = useStore()
  const [tipo, setTipo] = useState<TipoRegistro>(tiposReunion[0])
  const [sel, setSel] = useState<string[]>([])
  const [titulo, setTitulo] = useState('')
  const [otros, setOtros] = useState<{ id: string; nombre: string; curso: string }[]>([])
  const [fecha, setFecha] = useState(() => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    return diaLocal(manana)
  })
  const [horaVal, setHora] = useState('17:00')
  const tituloPropio = tipo === 'otraAmassada' || tipo === 'otroClaustre'
  const teEscoti = tipo === 'teEscoti'
  const instante = new Date(`${fecha}T${horaVal}`)
  const tieneAlumnado = sel.length > 0 || (teEscoti && otros.length > 0)
  const completos = !teEscoti || otros.every((a) => a.nombre.trim() && a.curso.trim())
  const ok = (claustre || tieneAlumnado) && completos &&
    (!tituloPropio || titulo.trim().length > 0) && Number.isFinite(instante.getTime())

  const toggle = (id: string) =>
    setSel((s) => tipo === 'reunionFamilia' ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  const editarOtro = (id: string, campo: 'nombre' | 'curso', valor: string) =>
    setOtros((lista) => lista.map((a) => a.id === id ? { ...a, [campo]: valor } : a))

  const crear = () => {
    if (!ok) return
    addRegistro({
      tipo,
      fecha: instante.toISOString(),
      alumnoIds: sel,
      titulo: tituloPropio ? titulo.trim() : undefined,
      alumnosOtrosCursos: teEscoti && otros.length > 0
        ? otros.map((a) => ({ nombre: a.nombre.trim(), curso: a.curso.trim() }))
        : undefined,
      texto: '',
      etiquetas: [],
      visibilidad: teEscoti ? 'protegido' : tipo === 'reunionFamilia' ? 'normal' : 'reservado',
      programada: true,
      estado: teEscoti ? 'abierto' : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={tituloNueva} onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface md:max-w-lg md:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <button onClick={onClose} className="grid size-11 place-items-center text-muted" aria-label={t.cancelar}>
            <X size={22} />
          </button>
          <span className="font-semibold">{tituloNueva}</span>
          <button onClick={crear} disabled={!ok} className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40">
            {t.crear}
          </button>
        </div>
        <div className="space-y-3 p-4">
          <Campos titulo={t.tipo} resumen={tipoLabel[tipo]}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tiposReunion.map((tp) => (
                <button key={tp} aria-pressed={tipo === tp} onClick={() => {
                  setTipo(tp)
                  if (tp === 'reunionFamilia') setSel((s) => s.slice(0, 1))
                }} className={clsx('min-h-11 rounded-xl border px-2 text-sm',
                  tipo === tp ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line')}>
                  {tipoLabel[tp]}
                </button>
              ))}
            </div>
          </Campos>
          {tituloPropio && (
            <Campos titulo={t.tituloCita} resumen={titulo}>
              <input aria-label={t.tituloCita} value={titulo} onChange={(e) => setTitulo(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-bg px-3" />
            </Campos>
          )}
          <Campos titulo={t.fechaYHora} resumen={[fecha, horaVal].filter(Boolean).join(' · ')}>
            <div className="grid grid-cols-2 gap-2">
              <label className="min-w-0 text-xs font-semibold text-muted">
                {t.fechaLbl}
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-base text-ink" />
              </label>
              <label className="min-w-0 text-xs font-semibold text-muted">
                {t.horaLbl}
                <input type="time" value={horaVal} onChange={(e) => setHora(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-base text-ink" />
              </label>
            </div>
          </Campos>
          {!claustre && (
            <Campos titulo={t.elegirAlumnos} resumen={sel.length ? String(sel.length) : undefined}>
              <div className="flex flex-wrap gap-2">
                {alumnos.map((a) => (
                  <button key={a.id} onClick={() => toggle(a.id)} aria-pressed={sel.includes(a.id)}
                    className={clsx('min-h-11 rounded-full border px-3 text-sm',
                      sel.includes(a.id) ? 'border-accent bg-accent text-on-accent' : 'border-line')}>
                    {a.nombre}
                  </button>
                ))}
              </div>
            </Campos>
          )}
          {teEscoti && (
            <Campos titulo={t.otrosCursos} resumen={otros.length ? String(otros.length) : undefined}>
              <div className="space-y-3">
                {otros.map((a) => (
                  <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                    <label className="min-w-0 text-xs font-semibold text-muted">
                      {t.nombreAlumno}
                      <input value={a.nombre} onChange={(e) => editarOtro(a.id, 'nombre', e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-base text-ink" />
                    </label>
                    <label className="min-w-0 text-xs font-semibold text-muted">
                      {t.cursoAlumno}
                      <input value={a.curso} onChange={(e) => editarOtro(a.id, 'curso', e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-base text-ink" />
                    </label>
                    <button aria-label={t.quitarAlumno} onClick={() => setOtros((lista) => lista.filter((item) => item.id !== a.id))} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-bg">
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button onClick={() => {
                  const id = crypto.randomUUID()
                  setOtros((lista) => [...lista, { id, nombre: '', curso: '' }])
                }} className="flex min-h-11 items-center gap-2 rounded-xl bg-accent-soft px-3 text-sm font-semibold text-accent">
                  <Plus size={17} /> {t.agregarAlumno}
                </button>
              </div>
            </Campos>
          )}
        </div>
      </div>
    </div>
  )
}

function Campos({ titulo, resumen, children }: { titulo: string; resumen?: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(true)
  return (
    <details open={abierto} onToggle={(e) => setAbierto(e.currentTarget.open)} className="rounded-xl border border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm">
        <span className="font-semibold">{titulo}</span>
        {resumen && <span className="min-w-0 flex-1 truncate text-right text-xs text-muted">{resumen}</span>}
        <ChevronDown size={16} className="ml-auto shrink-0 text-muted" aria-hidden />
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  )
}
