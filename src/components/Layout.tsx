import clsx from 'clsx'
import { CalendarDays, ListChecks, Plus, Sun, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { QuickCapture } from './QuickCapture'

export function Layout() {
  const { t, toggle } = useI18n()
  const [captureOpen, setCaptureOpen] = useState(false)

  const items = [
    { to: '/', label: t.hoy, icon: Sun, end: true },
    { to: '/alumnado', label: t.alumnado, icon: Users },
    { to: '/agenda', label: t.agenda, icon: CalendarDays },
    { to: '/seguimiento', label: t.seguimiento, icon: ListChecks },
  ]

  return (
    <div className="flex h-full">
      {/* iPad y ordenador: barra lateral */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface p-3 md:flex">
        <div className="mb-4 flex items-center gap-2 px-2 pt-2">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="text-lg font-bold">Tutoria</span>
        </div>
        <button
          onClick={() => setCaptureOpen(true)}
          className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 font-semibold text-white dark:text-black"
        >
          <Plus size={18} /> {t.nuevoRegistro}
        </button>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[15px]',
                  isActive ? 'bg-accent-soft font-semibold text-accent' : 'text-ink hover:bg-bg',
                )
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 px-2 text-xs text-muted">
          <button onClick={toggle} className="underline">
            {t.idioma}
          </button>
          <p>{t.prototipo}</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* iPhone: barra inferior con el + central */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {items.slice(0, 2).map((it) => (
            <TabItem key={it.to} {...it} />
          ))}
          <div className="flex justify-center">
            <button
              aria-label={t.nuevoRegistro}
              onClick={() => setCaptureOpen(true)}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg active:scale-95 dark:text-black"
            >
              <Plus size={28} />
            </button>
          </div>
          {items.slice(2).map((it) => (
            <TabItem key={it.to} {...it} />
          ))}
        </div>
      </nav>

      {captureOpen && <QuickCapture onClose={() => setCaptureOpen(false)} />}
    </div>
  )
}

function TabItem({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof Sun; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx('flex flex-col items-center gap-0.5 text-[11px]', isActive ? 'text-accent' : 'text-muted')
      }
    >
      <Icon size={22} />
      {label}
    </NavLink>
  )
}
