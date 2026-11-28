// Agenda: une el antiguo Aué (calendario) y Seguiment (lo pendiente). Semana o mes arriba, lo del día debajo,
// botón «Anotar» para apuntar en el día (nota, Ahèr o fecha del curso) y, al pie, los Pendents (decisión 0020).
import { CalendarDays, ChevronDown, RotateCcw, ChevronLeft, ChevronRight, Flag, Handshake, ListChecks, Pencil, Plus, StickyNote } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ControlGoogleCalendar } from '../components/ControlGoogleCalendar'
import { FormAher } from '../components/Formularios'
import { RegistroItem } from '../components/RegistroItem'
import { Card, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre, esTarea, tiposAmassada, type Aher, type TipoRegistro } from '../data/types'
import { ocurreEnDia } from '../lib/calendario'
import { diaLocal, fechaCorta, hora, mesYAnyo, semanaAbreviada } from '../lib/fechas'
import { listarMesGoogle, type EventoGoogle } from '../lib/googleCalendar'
import { useGoogleCalendar } from '../lib/GoogleCalendarProvider'
import { useI18n } from '../lib/i18n'
import { Apunts } from './Apunts'
import { Pendents } from './Pendents'

const amassades: readonly TipoRegistro[] = tiposAmassada
const esCita = (r: { tipo: TipoRegistro }) => esClaustre(r.tipo) || amassades.includes(r.tipo)
const aData = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const sumarDies = (s: string, n: number) => { const d = aData(s); return diaLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)) }

type Marca = 'citas' | 'notas' | 'tareas' | 'anotacion' | 'cors' | 'google'

export function Agenda() {
  const { t, lang, tipo } = useI18n()
  const { registros, ahers, alumnos, toggleAher } = useStore()
  const { conexion, revisarError } = useGoogleCalendar()
  const [hoy] = useState(() => diaLocal(new Date()))
  const [seleccion, setSeleccion] = useState(hoy)
  const [vista, setVista] = useState<'setmana' | 'mes'>('setmana')
  const { abrirCaptura } = useOutletContext<{ abrirCaptura: (o?: { dia?: string }) => void }>()
  const [editant, setEditant] = useState<Aher>()
  const clauMes = seleccion.slice(0, 7)
  const mes = useMemo(() => { const [y, m] = clauMes.split('-').map(Number); return new Date(y, m - 1, 1) }, [clauMes])
  const [agendaGoogle, setAgendaGoogle] = useState<{ mes: Date; token: string; eventos: EventoGoogle[]; error?: boolean }>()
  const token = conexion?.token

  useEffect(() => {
    if (!token) return
    const peticion = new AbortController()
    listarMesGoogle(token, mes, peticion.signal).then(
      (eventos) => { if (!peticion.signal.aborted) setAgendaGoogle({ mes, token, eventos }) },
      (error: unknown) => {
        if (peticion.signal.aborted) return
        revisarError(error)
        setAgendaGoogle({ mes, token, eventos: [], error: true })
      },
    )
    return () => peticion.abort()
  }, [mes, revisarError, token])

  const agendaActual = agendaGoogle && agendaGoogle.mes === mes && agendaGoogle.token === token ? agendaGoogle : undefined
  const eventosGoogle = (agendaActual?.eventos ?? []).filter((evento) => !registros.some((r) =>
    r.id === evento.extendedProperties?.private?.tutoriaRegistro && evento.start.dateTime &&
    Date.parse(r.fecha) === Date.parse(evento.start.dateTime),
  ))

  // Lo de cada día, en un solo sitio: lo usan las marcas del calendario y la lista del día.
  const delDia = (fecha: string) => {
    const regs = registros.filter((r) => diaLocal(r.fecha) === fecha)
    const meus = ahers.filter((a) => a.fecha === fecha && !a.responsable)
    return {
      citas: regs.filter(esCita),
      notas: regs.filter((r) => !esCita(r)),
      tareas: meus.filter(esTarea),
      anotacion: meus.filter((a) => a.clase === 'nota'),
      cors: meus.filter((a) => a.clase === 'data'),
      google: eventosGoogle.filter((evento) => ocurreEnDia(evento, fecha)),
    }
  }
  const marcas: { id: Marca; label: string }[] = [
    { id: 'cors', label: t.dataCors },
    { id: 'citas', label: t.reuniones },
    { id: 'tareas', label: t.acuerdos },
    { id: 'anotacion', label: t.calNotasAgenda },
    { id: 'notas', label: t.calNotas },
    ...(token ? [{ id: 'google' as const, label: 'Google Calendar' }] : []),
  ]
  const comptes = (fecha: string) => {
    const d = delDia(fecha)
    return marcas.flatMap(({ id, label }) => {
      const n = id === 'tareas' ? d.tareas.filter((a) => !a.completado).length : d[id].length
      return n ? [{ id, label, cantidad: n }] : []
    })
  }

  const dia = delDia(seleccion)
  const porHora = (xs: Aher[]) => [...xs].sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))
  const totalDia = dia.citas.length + dia.notas.length + dia.tareas.length + dia.anotacion.length + dia.cors.length + dia.google.length

  const dilluns = sumarDies(seleccion, -((aData(seleccion).getDay() + 6) % 7))
  const setmana = Array.from({ length: 7 }, (_, i) => sumarDies(dilluns, i))
  const inicioSemana = (mes.getDay() + 6) % 7
  const totalDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const diasCuadricula = Math.ceil((inicioSemana + totalDias) / 7) * 7
  // Flechas de arriba: siempre de mes en mes. En la vista de semana hay además la fila de semana anterior y siguiente.
  const moure = (salto: number) => setSeleccion(diaLocal(new Date(mes.getFullYear(), mes.getMonth() + salto, 1)))
  const rang = (dl: string) => `${Number(dl.slice(-2))}/${Number(dl.slice(5, 7))} – ${Number(sumarDies(dl, 6).slice(-2))}/${Number(sumarDies(dl, 6).slice(5, 7))}`
  const titol = mesYAnyo(mes, lang)

  return (
    <>
      <PageHeader title={t.agenda} icon={CalendarDays} color="miel" amplio />
      <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-6 sm:pt-5">
        <ControlGoogleCalendar />
        {agendaActual?.error && <p className="my-2 text-sm text-danger" role="status">{t.googleError}</p>}
        <div className="cal-layout mt-3 grid gap-4">
          <section className="cal-mes overflow-hidden rounded-[1.75rem] border border-line bg-surface">
            <header className="cal-cabecera flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
              {/* Tocar el título abre el selector de mes del sistema (en el iPhone, la rueda de mes y año). */}
                            <label className="relative flex min-w-0 cursor-pointer items-center gap-1.5">
                <h2 className="min-w-0 text-xl font-bold tracking-tight capitalize sm:text-2xl" aria-live="polite">{titol}</h2>
                <ChevronDown size={18} className="shrink-0 text-muted" aria-hidden />
                <input type="month" value={clauMes} aria-label={t.triarMes}
                  onChange={(e) => { if (e.target.value) { setSeleccion(`${e.target.value}-01`); setVista('mes') } }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <div className="flex shrink-0 items-center gap-1">
                {seleccion !== hoy && (
                  <button onClick={() => setSeleccion(hoy)} className="cal-control flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold"><RotateCcw size={15} aria-hidden />{t.tornarAue}</button>
                )}
                <button onClick={() => moure(-1)} aria-label={t.mesAnterior} className="cal-control grid size-11 place-items-center rounded-full">
                  <ChevronLeft size={20} aria-hidden />
                </button>
                <button onClick={() => moure(1)} aria-label={t.mesSiguiente} className="cal-control grid size-11 place-items-center rounded-full">
                  <ChevronRight size={20} aria-hidden />
                </button>
              </div>
              {vista === 'setmana' && (
                <div className="grid w-full grid-cols-2 gap-2 text-sm font-semibold">
                  <button onClick={() => setSeleccion(sumarDies(seleccion, -7))} aria-label={t.setmanaAnterior} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-accent hover:bg-bg">
                    <ChevronLeft size={16} aria-hidden />{rang(sumarDies(dilluns, -7))}
                  </button>
                  <button onClick={() => setSeleccion(sumarDies(seleccion, 7))} aria-label={t.setmanaSeguenta} className="flex min-h-11 items-center justify-center gap-1 rounded-xl border border-line text-accent hover:bg-bg">
                    {rang(sumarDies(dilluns, 7))}<ChevronRight size={16} aria-hidden />
                  </button>
                </div>
              )}
              <div role="tablist" className="grid w-full grid-cols-2 gap-1 rounded-xl bg-bg p-1">
                {(['setmana', 'mes'] as const).map((v) => (
                  <button key={v} role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
                    className={`min-h-10 rounded-lg text-sm font-semibold ${vista === v ? 'bg-accent text-on-accent' : 'text-muted'}`}>
                    {v === 'setmana' ? t.vistaSetmana : t.vistaMes}
                  </button>
                ))}
              </div>
            </header>

            <div className="px-2 pb-3 sm:px-4 sm:pb-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {semanaAbreviada(lang).map((d) => <span key={d} className="pb-2 text-xs font-semibold text-muted capitalize">{d}</span>)}
                {vista === 'setmana' ? setmana.map((fecha) => {
                  const visibles = comptes(fecha)
                  return (
                    <button key={fecha} onClick={() => setSeleccion(fecha)} aria-pressed={fecha === seleccion} aria-current={fecha === hoy ? 'date' : undefined}
                      aria-label={[fechaCorta(fecha, lang), ...visibles.map(({ label, cantidad }) => `${label} ${cantidad}`)].join(' · ')} className="cal-dia">
                      <span className="cal-numero">{Number(fecha.slice(-2))}</span>
                      <span aria-hidden className="cal-marcas">
                        {visibles.map(({ id, cantidad }) => <span className="cal-marca" data-marca={id} key={id}><span>{cantidad}</span></span>)}
                      </span>
                    </button>
                  )
                }) : Array.from({ length: diasCuadricula }, (_, i) => {
                  const numero = i - inicioSemana + 1
                  const fecha = diaLocal(new Date(mes.getFullYear(), mes.getMonth(), numero))
                  if (numero < 1 || numero > totalDias) return <span key={fecha} aria-hidden className="cal-dia cal-fuera">{Number(fecha.slice(-2))}</span>
                  const visibles = comptes(fecha)
                  return (
                    <button key={fecha} onClick={() => setSeleccion(fecha)} aria-pressed={fecha === seleccion} aria-current={fecha === hoy ? 'date' : undefined}
                      aria-label={[fechaCorta(fecha, lang), ...visibles.map(({ label, cantidad }) => `${label} ${cantidad}`)].join(' · ')} className="cal-dia">
                      <span className="cal-numero">{numero}</span>
                      <span aria-hidden className="cal-marcas">
                        {visibles.map(({ id, cantidad }) => <span className="cal-marca" data-marca={id} key={id}><span>{cantidad}</span></span>)}
                      </span>
                    </button>
                  )
                })}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 pt-2 text-xs font-medium text-muted">
                {marcas.map(({ id, label }) => <li key={id} className="flex items-center gap-1.5"><span className="cal-punto" data-marca={id} aria-hidden />{label}</li>)}
              </ul>
            </div>
          </section>

          <section aria-labelledby="agenda-dia" className="self-start">
            <div className="cal-agenda-cabecera flex items-center gap-3 px-4 py-4">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft font-bold text-accent">{Number(seleccion.slice(-2))}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted">{t.agenda}</p>
                <h2 id="agenda-dia" className="text-lg font-bold capitalize" aria-live="polite">{fechaCorta(seleccion, lang)}</h2>
              </div>
              <button onClick={() => abrirCaptura({ dia: seleccion })} aria-label={t.anotarEn} className="grid size-11 place-items-center rounded-full accion-coral">
                <Plus size={20} aria-hidden />
              </button>
            </div>
            <Card className="overflow-hidden">
              {totalDia === 0 ? (
                <button onClick={() => abrirCaptura({ dia: seleccion })} className="grid w-full justify-items-center gap-2 px-4 py-8 text-center text-sm text-muted">
                  <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent"><CalendarDays size={20} aria-hidden /></span>
                  {t.arrenAnotat}
                </button>
              ) : (
                <ul>
                  {porHora(dia.cors).map((a) => (
                    <li key={a.id} className="border-b border-line last:border-0">
                      <button onClick={() => setEditant(a)} className="cal-fila w-full text-left hover:bg-bg">
                        <span data-marca="cors" className="cal-icono-fila"><Flag size={19} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-muted">{t.dataCors}{a.hora && ` · ${a.hora}`}</span>
                          <span className="block font-semibold">{a.texto}</span>
                        </span>
                        <Pencil size={15} className="shrink-0 text-muted" aria-hidden />
                      </button>
                    </li>
                  ))}
                  {dia.citas.concat(dia.notas).sort((a, b) => a.fecha.localeCompare(b.fecha)).map((r) => esCita(r) ? (
                    <li key={r.id} className="border-b border-line last:border-0">
                      <Link to={`/reunion/${r.id}`} state={{ desdeTutoria: true }} className="cal-fila hover:bg-bg">
                        <span data-marca="citas" className="cal-icono-fila"><Handshake size={19} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-muted">{hora(r.fecha)} · {citaRealizada(r) ? t.citaHecha : t.pendiente}</span>
                          <span className="block font-semibold">{r.titulo || tipo[r.tipo]}</span>
                          {r.alumnoIds.length > 0 && <span className="block text-sm text-muted">{r.alumnoIds.map((id) => alumnos.find((a) => a.id === id)?.nombre).filter(Boolean).join(', ')}</span>}
                          {r.visibilidad !== 'protegido' && r.texto && <span className="block truncate text-sm text-muted">{r.texto}</span>}
                        </span>
                        <ChevronRight size={17} className="shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ) : <RegistroItem key={r.id} r={r} />)}
                  {dia.google.map((evento) => (
                    <li key={evento.id} className="cal-fila border-b border-line last:border-0">
                      <span data-marca="google" className="cal-icono-fila"><CalendarDays size={19} aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-muted">
                          {evento.calendario || 'Google Calendar'}
                          {evento.start.date && ` · ${t.calTotEthDia}`}
                          {evento.start.dateTime && diaLocal(evento.start.dateTime) === seleccion && ` · ${hora(evento.start.dateTime)}`}
                        </span>
                        <span className="block font-semibold">{evento.summary || t.googleEvento}</span>
                      </span>
                    </li>
                  ))}
                  {porHora(dia.tareas).map((a) => (
                    <li key={a.id} className="flex items-center border-b border-line last:border-0">
                      <label className="cal-fila flex-1 cursor-pointer hover:bg-bg">
                        <span data-marca="tareas" className="cal-icono-fila"><ListChecks size={19} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-muted">{t.acuerdos}{a.hora && ` · ${a.hora}`}</span>
                          <span className={`block font-semibold ${a.completado ? 'text-muted line-through' : ''}`}>{a.texto}</span>
                        </span>
                        <input type="checkbox" checked={a.completado} onChange={() => toggleAher(a.id)} className="size-6 shrink-0 accent-accent" aria-label={a.texto} />
                      </label>
                      <button onClick={() => setEditant(a)} aria-label={t.editar} className="mr-2 grid size-10 place-items-center rounded-lg text-muted hover:bg-bg"><Pencil size={15} /></button>
                    </li>
                  ))}
                  {porHora(dia.anotacion).map((a) => (
                    <li key={a.id} className="border-b border-line last:border-0">
                      <button onClick={() => setEditant(a)} className="cal-fila w-full text-left hover:bg-bg">
                        <span data-marca="anotacion" className="cal-icono-fila"><StickyNote size={19} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-muted">{t.notaAgenda}{a.hora && ` · ${a.hora}`}</span>
                          <span className="block whitespace-pre-wrap font-semibold">{a.texto}</span>
                        </span>
                        <Pencil size={15} className="shrink-0 text-muted" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>

        <div className="mt-6">
          <SectionTitle>{t.herSeguiment}</SectionTitle>
          <Pendents />
        </div>

        {/* Anotacions: la línea del tiempo de notas, Ahèrs, fechas y registros, en su propio espacio (decisión 0023). */}
        <section className="mt-6">
          <SectionTitle>{t.anotacions}</SectionTitle>
          <Card><div className="p-3 sm:p-4"><Apunts onEditar={setEditant} /></div></Card>
        </section>
      </div>


            {editant && <FormAher aher={editant} onClose={() => setEditant(undefined)} />}
    </>
  )
}
