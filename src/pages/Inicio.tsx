import { useState } from 'react'
import { ArrowRight, Building2, CalendarDays, FileLock2, Handshake, ListChecks, Plus, Sun, Users } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { Ajustes } from '../components/Ajustes'
import { LogoTutoria } from '../components/LogoTutoria'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre } from '../data/types'
import { diasDesdeHoy, fechaCorta, fechaHora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Inicio() {
  const { t, lang, tipo } = useI18n()
  const { abrirCaptura } = useOutletContext<{ abrirCaptura: () => void }>()
  const { registros, ahers, alumnos, curso } = useStore()
  const [fecha] = useState(() => new Date().toISOString())

  const proximas = registros
    .filter((r) => r.programada && !citaRealizada(r) && !esClaustre(r.tipo) && Date.parse(r.fecha) >= Date.parse(fecha))
    .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha))
  const siguiente = proximas[0]
  const reunionesHoy = registros.filter((r) => r.programada && !citaRealizada(r) && !esClaustre(r.tipo) && diasDesdeHoy(r.fecha) === 0).length
  const pendientes = ahers.filter((a) => !a.completado && !a.responsable)
  const revisiones = pendientes.filter((a) => a.fecha && diasDesdeHoy(a.fecha) <= 0).length

  const secciones = [
    { to: '/uei', icon: Sun, color: 'menta', label: t.hoy, detail: `${t.reunionesHoyN} · ${reunionesHoy}` },
    { to: '/alumnado', icon: Users, color: 'azul', label: t.alumnado, detail: `${alumnos.length} ${t.alumnosN.toLowerCase()} · ${curso.grupos.join(', ')}` },
    { to: '/reuniones', icon: Handshake, color: 'lila', label: t.reuniones, detail: `${t.proximasN} · ${proximas.length}` },
    { to: '/claustre', icon: Building2, color: 'miel', label: t.claustre, detail: [tipo.ciclo, tipo.mentoria].join(' · ') },
    { to: '/seguimiento', icon: ListChecks, color: 'coral', label: t.seguimiento, detail: `${t.acuerdosAbiertosN} · ${pendientes.length}` },
    ...(import.meta.env.VITE_SINGLEFILE ? [{ to: '/informes', icon: FileLock2, color: 'azul', label: t.bancoInformes, detail: t.informesPrivados }] : []),
  ]

  return (
    <div className="pt-safe mx-auto max-w-6xl px-3 sm:px-6">
      <div className="h-3 sm:h-5" aria-hidden />
      <header className="franja-inicio flex items-center gap-3 rounded-2xl px-4 py-3 sm:px-5">
        <LogoTutoria className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-lg leading-tight font-bold tracking-tight">Tutoria</div>
          <p className="text-xs font-medium text-[#c5dde8]">{curso.anyo} · {curso.grupos.join(', ')}</p>
        </div>
        <Ajustes />
      </header>

      <section className="inicio-saludo relative isolate mt-4 overflow-hidden rounded-2xl px-5 py-5 sm:px-7">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium capitalize text-muted">{fechaCorta(fecha, lang)}</p>
            <h1 className="mt-1 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{t.bonDia}</h1>
          </div>
          <button onClick={abrirCaptura} className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold">
            <Plus size={20} aria-hidden /> {t.nuevoRegistro}
          </button>
        </div>
      </section>

      <nav className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {secciones.map(({ to, icon: Icon, color, label, detail }) => (
          <Link key={to} to={to} data-color={color} className="inicio-seccion">
            <span className="inicio-icono"><Icon size={22} aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">{label}</span>
              <span className="inicio-detalle block text-xs leading-relaxed">{detail}</span>
            </span>
            <ArrowRight size={17} className="inicio-flecha shrink-0" aria-hidden />
          </Link>
        ))}
      </nav>

      {(siguiente || revisiones > 0) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {siguiente && (
            <Link to={`/reunion/${siguiente.id}`} state={{ desdeTutoria: true }} className="inicio-resumen">
              <span className="inicio-icono" data-color="lila"><CalendarDays size={21} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.proximaReunion}</span>
                <span className="block text-xs text-muted">{siguiente.titulo || tipo[siguiente.tipo]} · {fechaHora(siguiente.fecha, lang)}</span>
              </span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          )}
          {revisiones > 0 && (
            <Link to="/seguimiento" className="inicio-resumen">
              <span className="inicio-icono" data-color="coral"><ListChecks size={21} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.acuerdosVencen}</span>
                <span className="block text-xs text-muted">{t.revisiones} · {revisiones}</span>
              </span>
              <ArrowRight size={16} aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
