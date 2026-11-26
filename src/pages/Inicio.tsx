// «Inici»: qué tengo hoy (Aué) y adónde voy (cuatro botones). Sin barra inferior en el móvil.
import clsx from 'clsx'
import { Building2, ChevronRight, FileLock2, Handshake, ListChecks, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Ajustes } from '../components/Ajustes'
import { MarcaTutoria } from '../components/MarcaTutoria'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre } from '../data/types'
import { ocurreEnDia } from '../lib/calendario'
import { diaLocal, diasDesdeHoy, fechaCorta, hora } from '../lib/fechas'
import { listarMesGoogle, type EventoGoogle } from '../lib/googleCalendar'
import { useGoogleCalendar } from '../lib/GoogleCalendarProvider'
import { useI18n } from '../lib/i18n'

interface ItemDia {
  id: string
  hora?: string // HH:MM; sin hora = todo el día
  titulo: string
  detalle?: string
  origen: 'tutoria' | 'google' | 'aher'
  to?: string
}

export function Inicio() {
  const { t, lang, tipo } = useI18n()
  const { abrirCaptura } = useOutletContext<{ abrirCaptura: () => void }>()
  const { registros, ahers, alumnos, alumnosActivos, curso } = useStore()
  const { conexion, revisarError } = useGoogleCalendar()
  const [ahora] = useState(() => new Date())
  const hoy = diaLocal(ahora)
  const [google, setGoogle] = useState<EventoGoogle[]>([])

  useEffect(() => {
    if (!conexion) return
    const control = new AbortController()
    const mes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    listarMesGoogle(conexion.token, mes, control.signal).then(setGoogle, (e) => {
      if (!control.signal.aborted) revisarError(e)
    })
    return () => control.abort()
  }, [conexion, ahora, revisarError])

  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'
  const citasHoy = registros.filter((r) => r.programada && !citaRealizada(r) && diasDesdeHoy(r.fecha) === 0)
  const misAhers = ahers.filter((a) => !a.completado && !a.responsable)
  const vencidos = misAhers.filter((a) => a.fecha && diasDesdeHoy(a.fecha) < 0).length

  const items: ItemDia[] = [
    ...citasHoy.map((r) => ({
      id: r.id,
      hora: hora(r.fecha),
      titulo: r.titulo || tipo[r.tipo],
      detalle: r.alumnoIds.map(nombre).join(', ') || undefined,
      origen: 'tutoria' as const,
      to: `/reunion/${r.id}`,
    })),
    ...(conexion ? google : [])
      .filter((e) => ocurreEnDia(e, hoy) && !e.extendedProperties?.private?.tutoriaRegistro)
      .map((e) => ({
        id: e.id,
        hora: e.start.dateTime ? hora(e.start.dateTime) : undefined,
        titulo: e.summary || 'Google Calendar',
        detalle: 'Google Calendar',
        origen: 'google' as const,
      })),
    ...misAhers
      .filter((a) => a.fecha && diasDesdeHoy(a.fecha) === 0)
      .map((a) => ({ id: a.id, titulo: a.texto, detalle: t.acuerdos, origen: 'aher' as const, to: '/seguimiento' })),
  ]
  items.sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''))

  const proximas = registros.filter((r) => r.programada && !citaRealizada(r) && !esClaustre(r.tipo) && diasDesdeHoy(r.fecha) >= 0).length
  const claustreProximo = registros.filter((r) => esClaustre(r.tipo) && !citaRealizada(r) && diasDesdeHoy(r.fecha) >= 0).length

  const botones = [
    { to: '/alumnado', icon: Users, label: t.alumnado, detalle: [String(alumnosActivos.length), ...curso.grupos].join(' · ') },
    { to: '/reuniones', icon: Handshake, label: t.reuniones, detalle: `${t.proximasN} · ${proximas}` },
    { to: '/claustre', icon: Building2, label: t.claustre, detalle: `${t.proximasN} · ${claustreProximo}` },
    {
      to: '/seguimiento',
      icon: ListChecks,
      label: t.seguimiento,
      detalle: vencidos > 0 ? `${t.revisionVencida} · ${vencidos}` : `${t.acuerdosAbiertosN} · ${misAhers.length}`,
      aviso: vencidos > 0,
    },
  ]

  return (
    <div className="pt-safe mx-auto max-w-3xl px-4">
      <header className="flex items-center justify-between gap-3 pt-5">
        <MarcaTutoria className="h-9 w-auto text-ink md:invisible" />
        <Ajustes />
      </header>
      <p className="mt-4 text-sm font-medium capitalize text-muted">
        {fechaCorta(ahora.toISOString(), lang)} · {curso.anyo}
      </p>
      <h1 className="text-3xl leading-tight font-bold tracking-tight">{t.bonDia}</h1>

      {/* Aué: lo de hoy, de Tutoria y de Google Calendar */}
      <section className="mt-4 rounded-2xl border border-line bg-surface">
        <Link to="/uei" className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-muted">{t.hoy}</span>
          <span className="flex items-center gap-1 text-sm font-medium text-accent">
            {t.verCalendario} <ChevronRight size={16} aria-hidden />
          </span>
        </Link>
        {items.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted">{t.nadaPendiente}</p>
        ) : (
          <ul className="pb-1">
            {items.map((it) => {
              const fila = (
                <>
                  <span className="w-14 shrink-0 text-[15px] font-semibold tabular-nums">{it.hora ?? '—'}</span>
                  <span
                    className={clsx(
                      'h-8 w-1 shrink-0 rounded-full',
                      it.origen === 'google' ? 'bg-line' : it.origen === 'aher' ? 'bg-coral-accion' : 'bg-accent',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{it.titulo}</span>
                    {it.detalle && <span className="block truncate text-xs text-muted">{it.detalle}</span>}
                  </span>
                </>
              )
              return (
                <li key={`${it.origen}-${it.id}`} className="border-t border-line">
                  {it.to ? (
                    <Link to={it.to} state={{ desdeTutoria: true }} className="flex items-center gap-3 px-4 py-2.5">
                      {fila}
                      <ChevronRight size={16} className="text-muted" aria-hidden />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5">{fila}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button
        onClick={abrirCaptura}
        className="accion-coral mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold shadow-sm active:scale-[0.99]"
      >
        <Plus size={24} aria-hidden /> {t.nuevoRegistro}
      </button>

      <nav className="mt-4 grid grid-cols-2 gap-3">
        {botones.map(({ to, icon: Icon, label, detalle, aviso }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-32 flex-col justify-between rounded-2xl border border-line bg-surface p-4 hover:border-accent active:scale-[0.98]"
          >
            <span className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon size={24} aria-hidden />
              </span>
              {aviso && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-danger" aria-hidden />}
            </span>
            <span>
              <span className="block text-lg font-bold">{label}</span>
              <span className={clsx('block text-sm', aviso ? 'font-medium text-danger' : 'text-muted')}>{detalle}</span>
            </span>
          </Link>
        ))}
      </nav>

      {import.meta.env.VITE_SINGLEFILE && (
        <Link to="/informes" className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <FileLock2 size={20} className="text-accent" aria-hidden />
          <span className="flex-1 font-medium">{t.bancoInformes}</span>
          <ChevronRight size={16} className="text-muted" aria-hidden />
        </Link>
      )}
    </div>
  )
}
