// Tarjetas de autorizaciones de un alumno: verde (sí), ámbar (a viatges), rojo (no), gris (pendiente).
import clsx from 'clsx'
import { Check, Minus, Settings2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import type { Alumno, EstadoAutorizacion } from '../data/types'
import { iconoAutorizacion } from '../lib/iconos'
import { useI18n } from '../lib/i18n'

// Dos opciones: pendent → òc → non → pendent. Tres: pendent → tostemp → a viatges → non → pendent.
const SIGUIENTE_2: Record<string, EstadoAutorizacion | undefined> = { pendiente: 'si', si: 'no', no: undefined, aviatges: 'no' }
const SIGUIENTE_3: Record<string, EstadoAutorizacion | undefined> = { pendiente: 'si', si: 'aviatges', aviatges: 'no', no: undefined }

/** Texto de cada estado según el tipo de autorización. */
export function useEtiquetaEstado() {
  const { t } = useI18n()
  return (estado: EstadoAutorizacion | 'pendiente', tres?: boolean) =>
    estado === 'si' ? (tres ? t.estadoTostemp : t.estadoSi) : estado === 'no' ? t.estadoNo : estado === 'aviatges' ? t.estadoAViatges : t.pendiente
}

export const estiloEstado: Record<EstadoAutorizacion | 'pendiente', { tarjeta: string; icono: string; marca: string }> = {
  si: { tarjeta: 'border-emerald-300 bg-emerald-50', icono: 'bg-emerald-600 text-white', marca: 'text-emerald-700' },
  aviatges: { tarjeta: 'border-amber-300 bg-amber-50', icono: 'bg-amber-500 text-white', marca: 'text-amber-700' },
  no: { tarjeta: 'border-red-300 bg-red-50', icono: 'bg-red-600 text-white', marca: 'text-red-700' },
  pendiente: { tarjeta: 'border-line bg-surface', icono: 'bg-bg text-muted', marca: 'text-muted' },
}

export function TarjetasAutorizacion({ alumno }: { alumno: Alumno }) {
  const { t } = useI18n()
  const { tiposAutorizacion, setAutorizacion } = useStore()
  const etiqueta = useEtiquetaEstado()
  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiposAutorizacion.map((tipo) => {
          const estado = alumno.autorizaciones?.[tipo.id] ?? 'pendiente'
          const estilo = estiloEstado[estado]
          const Icono = iconoAutorizacion(tipo.icono)
          const Marca = estado === 'si' ? Check : estado === 'no' ? X : estado === 'aviatges' ? Minus : null
          return (
            <li key={tipo.id}>
              <button
                onClick={() => setAutorizacion(alumno.id, tipo.id, (tipo.tresEstados ? SIGUIENTE_3 : SIGUIENTE_2)[estado])}
                aria-label={`${tipo.nombre}: ${etiqueta(estado, tipo.tresEstados)}`}
                className={clsx('relative flex w-full flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition active:scale-[0.97]', estilo.tarjeta)}
              >
                <span className={clsx('grid size-12 place-items-center rounded-full', estilo.icono)}>
                  <Icono size={24} aria-hidden />
                </span>
                <span className="font-semibold leading-tight">{tipo.nombre}</span>
                <span className={clsx('flex items-center gap-1 text-sm font-medium', estilo.marca)}>
                  {Marca && <Marca size={15} strokeWidth={3} aria-hidden />} {etiqueta(estado, tipo.tresEstados)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">{t.tocaCambiar}</p>
      <Link to="/autorizaciones" className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent">
        <Settings2 size={15} aria-hidden /> {t.gestionarAutorizaciones}
      </Link>
    </div>
  )
}
