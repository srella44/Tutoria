import { CalendarDays, ChevronLeft, ChevronRight, Handshake, ListChecks } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ControlGoogleCalendar } from '../components/ControlGoogleCalendar'
import { RegistroItem } from '../components/RegistroItem'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre, tiposAmassada, type TipoRegistro } from '../data/types'
import { diaLocal, fechaCorta, hora, mesYAnyo, semanaAbreviada } from '../lib/fechas'
import { listarMesGoogle, type EventoGoogle } from '../lib/googleCalendar'
import { useGoogleCalendar } from '../lib/GoogleCalendarProvider'
import { useI18n } from '../lib/i18n'

const amassades: readonly TipoRegistro[] = tiposAmassada

function esCita(r: { tipo: TipoRegistro }) {
  return esClaustre(r.tipo) || amassades.includes(r.tipo)
}

function ocurreEnDia(evento: EventoGoogle, dia: string) {
  if (evento.start.date) {
    return evento.start.date <= dia && (evento.end.date ? dia < evento.end.date : dia === evento.start.date)
  }
  if (!evento.start.dateTime) return false
  const inicioDia = Date.parse(`${dia}T00:00:00`)
  const siguiente = new Date(inicioDia)
  siguiente.setDate(siguiente.getDate() + 1)
  const inicio = Date.parse(evento.start.dateTime)
  const fin = evento.end.dateTime ? Date.parse(evento.end.dateTime) : inicio
  return inicio < siguiente.getTime() && (fin > inicioDia || inicio >= inicioDia)
}

export function Hoy() {
  const { t, lang, tipo } = useI18n()
  const { registros, ahers, alumnos } = useStore()
  const { conexion, revisarError } = useGoogleCalendar()
  const [hoy] = useState(() => new Date())
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [seleccion, setSeleccion] = useState(() => diaLocal(hoy))
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
  const googleDia = eventosGoogle.filter((evento) => ocurreEnDia(evento, seleccion))
  const inicioSemana = (mes.getDay() + 6) % 7
  const totalDias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const tareas = ahers.filter((a) => !a.completado && !a.responsable)
  const entradas = registros.filter((r) => diaLocal(r.fecha) === seleccion).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const tareasDia = tareas.filter((a) => a.fecha === seleccion)
  const marcas = [
    { id: 'citas', label: t.reuniones },
    { id: 'notas', label: t.calNotas },
    { id: 'tareas', label: t.acuerdos },
    ...(token ? [{ id: 'google', label: 'Google Calendar' }] : []),
  ]
  const totalAgenda = entradas.length + tareasDia.length + googleDia.length
  const diaHoy = diaLocal(hoy)
  const diasCuadricula = Math.ceil((inicioSemana + totalDias) / 7) * 7

  const cambiarMes = (salto: number) => {
    const siguiente = new Date(mes.getFullYear(), mes.getMonth() + salto, 1)
    setMes(siguiente)
    setSeleccion(diaLocal(siguiente))
  }

  const volverHoy = () => {
    setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
    setSeleccion(diaLocal(hoy))
  }

  return (
    <>
      <PageHeader title={t.hoy} icon={CalendarDays} color="miel" amplio />
      <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-6 sm:pt-5">
        <ControlGoogleCalendar />
        {agendaActual?.error && <p className="my-2 text-sm text-danger" role="status">{t.googleError}</p>}
        <div className="cal-layout mt-3 grid gap-4">
          <section className="cal-mes overflow-hidden rounded-[1.75rem] border border-line bg-surface">
            <header className="cal-cabecera flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="cal-icono-mes hidden size-11 shrink-0 place-items-center rounded-2xl sm:grid">
                  <CalendarDays size={23} aria-hidden />
                </span>
                <h2 className="text-xl font-bold tracking-tight capitalize sm:text-2xl" aria-live="polite">{mesYAnyo(mes, lang)}</h2>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={volverHoy} className="cal-control min-h-11 rounded-full px-3 text-sm font-semibold">{t.hoy}</button>
                <button onClick={() => cambiarMes(-1)} aria-label={t.mesAnterior} className="cal-control grid size-11 place-items-center rounded-full">
                  <ChevronLeft size={20} aria-hidden />
                </button>
                <button onClick={() => cambiarMes(1)} aria-label={t.mesSiguiente} className="cal-control grid size-11 place-items-center rounded-full">
                  <ChevronRight size={20} aria-hidden />
                </button>
              </div>
            </header>

            <div className="px-2 py-3 sm:px-4 sm:py-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {semanaAbreviada(lang).map((d) => <span key={d} className="pb-2 text-xs font-semibold text-muted capitalize">{d}</span>)}
                {Array.from({ length: diasCuadricula }, (_, i) => {
                  const numero = i - inicioSemana + 1
                  const fecha = diaLocal(new Date(mes.getFullYear(), mes.getMonth(), numero))
                  const fuera = numero < 1 || numero > totalDias
                  if (fuera) {
                    return <span key={fecha} aria-hidden className="cal-dia cal-fuera">{Number(fecha.slice(-2))}</span>
                  }

                  const activo = fecha === seleccion
                  const delDia = registros.filter((r) => diaLocal(r.fecha) === fecha)
                  const conteos = [
                    delDia.filter(esCita).length,
                    delDia.filter((r) => !esCita(r)).length,
                    tareas.filter((a) => a.fecha === fecha).length,
                    eventosGoogle.filter((evento) => ocurreEnDia(evento, fecha)).length,
                  ]
                  const visibles = marcas.flatMap((marca, indice) => conteos[indice] ? [{ ...marca, cantidad: conteos[indice] }] : [])
                  const etiqueta = [fechaCorta(fecha, lang), ...visibles.map(({ label, cantidad }) => `${label} ${cantidad}`)].join(' · ')
                  return (
                    <button key={fecha} onClick={() => setSeleccion(fecha)} aria-label={etiqueta} aria-pressed={activo}
                      aria-current={fecha === diaHoy ? 'date' : undefined} className="cal-dia">
                      <span className="cal-numero">{numero}</span>
                      <span aria-hidden className="cal-marcas">
                        {visibles.map(({ id, cantidad }) => (
                          <span className="cal-marca" data-marca={id} key={id}><span>{cantidad}</span></span>
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 px-1 pt-2 text-xs font-medium text-muted">
                {marcas.map(({ id, label }) => (
                  <li key={id} className="flex items-center gap-1.5">
                    <span className="cal-punto" data-marca={id} aria-hidden />{label}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="cal-dia-agenda" className="self-start">
            <div className="cal-agenda-cabecera flex items-center gap-3 px-4 py-4">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft font-bold text-accent">
                {Number(seleccion.slice(-2))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-muted">{t.agenda}</p>
                <h2 id="cal-dia-agenda" className="text-lg font-bold capitalize" aria-live="polite">{fechaCorta(seleccion, lang)}</h2>
              </div>
              <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-muted">{totalAgenda}</span>
            </div>
            <Card className="overflow-hidden">
              {totalAgenda === 0 ? (
                <div className="grid justify-items-center gap-2 px-4 py-8 text-center text-sm text-muted">
                  <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent">
                    <CalendarDays size={20} aria-hidden />
                  </span>
                  {t.sinRegistros}
                </div>
              ) : (
                <ul>
                  {entradas.map((r) => esCita(r) ? (
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
                  {googleDia.map((evento) => (
                    <li key={evento.id} className="cal-fila border-b border-line last:border-0">
                      <span data-marca="google" className="cal-icono-fila"><CalendarDays size={19} aria-hidden /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-muted">
                          Google Calendar
                          {evento.start.date && ` · ${t.calTotEthDia}`}
                          {evento.start.dateTime && diaLocal(evento.start.dateTime) === seleccion && ` · ${hora(evento.start.dateTime)}`}
                        </span>
                        <span className="block font-semibold">{evento.summary || t.googleEvento}</span>
                      </span>
                    </li>
                  ))}
                  {tareasDia.map((a) => (
                    <li key={a.id} className="border-b border-line last:border-0">
                      <Link to="/seguimiento" className="cal-fila hover:bg-bg">
                        <span data-marca="tareas" className="cal-icono-fila"><ListChecks size={19} aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-muted">{t.acuerdos}</span>
                          <span className="block font-semibold">{a.texto}</span>
                        </span>
                        <ChevronRight size={17} className="shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>
      </div>
    </>
  )
}
