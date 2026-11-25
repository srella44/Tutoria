// «Inici»: pantalla de inicio con botones grandes. Sin barra inferior; al entrar en una sección aparece.
import clsx from 'clsx'
import { Handshake, ListChecks, Plus, Sun, Users } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { Ajustes } from '../components/Ajustes'
import { useStore } from '../data/store'
import { diasDesdeHoy, fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Inicio() {
  const { t, lang } = useI18n()
  const { abrirCaptura } = useOutletContext<{ abrirCaptura: () => void }>()
  const { registros, acuerdos, alumnos, curso } = useStore()

  const reunionesHoy = registros.filter((r) => r.programada && diasDesdeHoy(r.fecha) === 0).length
  const proximas = registros.filter((r) => r.programada && diasDesdeHoy(r.fecha) >= 0).length
  const abiertas = registros.filter(
    (r) => r.estado === 'sinFirmar' || ((r.tipo === 'incidencia' || r.tipo === 'teEscoti') && r.estado === 'abierto'),
  ).length
  const acuerdosAbiertos = acuerdos.filter((a) => a.estado !== 'completado').length
  const vencidos = acuerdos.filter((a) => a.estado !== 'completado' && diasDesdeHoy(a.fechaRevision) <= 0).length

  const botones = [
    { to: '/uei', icon: Sun, label: t.hoy, detalle: `${t.reunionesHoyN}: ${reunionesHoy} · ${t.pendientesN}: ${abiertas + vencidos}`, aviso: vencidos > 0 },
    { to: '/alumnado', icon: Users, label: t.alumnado, detalle: `${t.alumnosN}: ${alumnos.length} · ${curso.grupos.join(', ')}` },
    { to: '/reuniones', icon: Handshake, label: t.reuniones, detalle: `${t.proximasN}: ${proximas}` },
    { to: '/seguimiento', icon: ListChecks, label: t.seguimiento, detalle: `${t.acuerdosAbiertosN}: ${acuerdosAbiertos}` },
  ]

  return (
    <div className="pt-safe mx-auto flex min-h-full max-w-3xl flex-col px-4">
      <header className="flex items-start justify-between pb-6 pt-6">
        <div>
          <p className="text-sm capitalize text-muted">{fechaCorta(new Date().toISOString(), lang)}</p>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">{t.bonDia}</h1>
          <p className="text-muted">
            Tutoria · {curso.anyo}
          </p>
        </div>
        <Ajustes />
      </header>

      <button
        onClick={abrirCaptura}
        className="mb-4 flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-accent px-4 text-lg font-semibold text-on-accent shadow-sm active:scale-[0.99]"
      >
        <Plus size={26} /> {t.nuevoRegistro}
      </button>

      <nav className="grid grid-cols-2 gap-3">
        {botones.map(({ to, icon: Icon, label, detalle, aviso }) => (
          <Link
            key={to}
            to={to}
            className="flex aspect-square flex-col justify-between rounded-3xl border border-line bg-surface p-4 active:scale-[0.98] sm:aspect-[4/3]"
          >
            <span className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Icon size={26} />
              </span>
              {aviso && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-danger" aria-hidden />}
            </span>
            <span>
              <span className="block text-xl font-semibold">{label}</span>
              <span className={clsx('block text-sm', aviso ? 'text-danger' : 'text-muted')}>{detalle}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
