// En pantallas anchas (iPad en horizontal, ordenador): lista del alumnado a la izquierda y ficha a la derecha.
// En el móvil y el iPad en vertical solo se ve la ficha.
import clsx from 'clsx'
import { NavLink, useParams } from 'react-router-dom'
import { Avatar } from '../components/ui'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'
import { AlumnoFicha } from './AlumnoFicha'

export function FichaConLista() {
  const { id } = useParams()
  const { t } = useI18n()
  const { alumnosActivos, curso } = useStore()
  return (
    <div className="lg:grid lg:h-full lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface lg:block lg:h-full lg:overflow-y-auto">
        <p className="sticky top-0 z-10 border-b border-line bg-surface px-4 py-3 text-sm font-semibold text-muted">
          {t.alumnado} · {[curso.anyo, ...curso.grupos].join(' · ')}
        </p>
        <nav aria-label={t.alumnado}>
          {alumnosActivos.map((a) => (
            <NavLink
              key={a.id}
              to={`/alumnado/${a.id}`}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 border-b border-line px-4 py-2',
                isActive ? 'bg-accent-soft font-semibold text-accent' : 'hover:bg-bg',
              )}
            >
              <Avatar nombre={a.nombre} apellidos={a.apellidos} size={32} />
              <span className="min-w-0 truncate">{a.nombre} <span className="font-normal text-muted">{a.apellidos}</span></span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 lg:h-full lg:overflow-y-auto">
        <AlumnoFicha key={id} />
      </div>
    </div>
  )
}
