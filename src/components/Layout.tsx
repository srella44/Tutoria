import clsx from 'clsx'
import { Building2, Handshake, House, ListChecks, Plus, Sun, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'
import { MarcaTutoria } from './MarcaTutoria'
import { QuickCapture } from './QuickCapture'

export function Layout() {
  const { t } = useI18n()
  const { curso } = useStore()
  const [captureOpen, setCaptureOpen] = useState(false)
  // En la pantalla de inicio no hay barra inferior: los botones grandes hacen de menú.
  const enInicio = useLocation().pathname === '/'

  const items = [
    { to: '/alumnado', label: t.alumnado, icon: Users },
    { to: '/reuniones', label: t.reuniones, icon: Handshake },
    { to: '/seguimiento', label: t.seguimiento, icon: ListChecks },
  ]

  return (
    <div className="flex h-full">
      {/* iPad y ordenador: barra lateral */}
      <aside className="lateral-app hidden w-56 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex lg:w-64">
        <NavLink to="/" end aria-label={t.inicio} className="mb-7 flex items-center gap-3 rounded-xl px-2 pt-4">
          <div>
            <MarcaTutoria className="h-8 w-auto text-ink" />
            <div className="mt-1.5 text-xs font-medium text-muted">{curso.anyo} · {curso.grupos.join(', ')}</div>
          </div>
        </NavLink>
        <button
          onClick={() => setCaptureOpen(true)}
          className="mb-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl accion-coral px-3 font-semibold"
        >
          <Plus size={18} /> {t.nuevoRegistro}
        </button>
        <nav className="flex flex-col gap-1">
          {[{ to: '/uei', label: t.hoy, icon: Sun }, ...items.slice(0, 2), { to: '/claustre', label: t.claustre, icon: Building2 }, items[2]].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px]',
                  isActive ? 'lateral-activo bg-accent-soft font-semibold text-accent' : 'text-ink hover:bg-bg',
                )
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-2 text-xs text-muted">{t.prototipo}</p>
      </aside>

      <main className={clsx('min-w-0 flex-1 overflow-y-auto md:pb-8', enInicio ? 'pb-8' : 'pb-28')}>
        <Outlet context={{ abrirCaptura: () => setCaptureOpen(true) }} />
      </main>

      {/* iPhone: barra inferior con el + central */}
      <nav hidden={enInicio} className="barra-app pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          <TabItem to="/" label={t.inicio} icon={House} end />
          <TabItem {...items[0]} />
          <div className="flex justify-center">
            <button
              aria-label={t.nuevoRegistro}
              onClick={() => setCaptureOpen(true)}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full accion-coral shadow-lg active:scale-95"
            >
              <Plus size={28} />
            </button>
          </div>
          {items.slice(1).map((it) => (
            <TabItem key={it.to} {...it} />
          ))}
        </div>
      </nav>

      {captureOpen && <QuickCapture onClose={() => setCaptureOpen(false)} />}
    </div>
  )
}

function TabItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Users; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx('mx-0.5 flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] sm:text-xs', isActive ? 'bg-accent-soft font-semibold text-accent' : 'text-muted')
      }
    >
      <Icon size={22} />
      {label}
    </NavLink>
  )
}
