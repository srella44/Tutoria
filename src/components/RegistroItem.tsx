import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import type { Registro } from '../data/types'
import { fechaHora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'
import { TipoChip, VisChip } from './ui'

export function RegistroItem({ r, showAlumnos = true }: { r: Registro; showAlumnos?: boolean }) {
  const { t, lang, tipo } = useI18n()
  const { alumnos } = useStore()
  const nombres = r.alumnoIds.map((id) => alumnos.find((a) => a.id === id)).filter(Boolean)
  const protegido = r.visibilidad === 'protegido'

  return (
    <li className="border-b border-line px-4 py-3 last:border-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <TipoChip tipo={r.tipo} label={tipo[r.tipo]} />
        <VisChip vis={r.visibilidad} labels={t} />
        <span className="ml-auto text-xs text-muted">{fechaHora(r.fecha, lang)}</span>
      </div>
      {showAlumnos && (
        <p className="text-sm font-medium">
          {nombres.map((a, i) => (
            <span key={a!.id}>
              {i > 0 && ', '}
              <Link to={`/alumnado/${a!.id}`} className="hover:underline">
                {a!.nombre}
              </Link>
            </span>
          ))}
        </p>
      )}
      {/* Los registros protegidos ocultan el texto hasta el desbloqueo extra (Fase 2). */}
      {protegido ? (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock size={14} /> ••••••
        </p>
      ) : (
        <p className="text-[15px] leading-snug">{r.texto}</p>
      )}
    </li>
  )
}
