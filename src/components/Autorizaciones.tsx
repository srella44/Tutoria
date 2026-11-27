// Tarjetas de autorizaciones de un alumno: verde (sí), ámbar (a viatges), rojo (no), gris (pendiente).
import clsx from 'clsx'
import { BookHeart, Check, Minus, Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import type { Alumno, EstadoAutorizacion } from '../data/types'
import { iconoAutorizacion } from '../lib/iconos'
import { useI18n } from '../lib/i18n'

// Dos opciones: pendent → òc → non → pendent. Tres: pendent → tostemp → a viatges → non → pendent.
export const SIGUIENTE_2: Record<string, EstadoAutorizacion | undefined> = { pendiente: 'si', si: 'no', no: undefined, aviatges: 'no' }
export const SIGUIENTE_3: Record<string, EstadoAutorizacion | undefined> = { pendiente: 'si', si: 'aviatges', aviatges: 'no', no: undefined }

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

/**
 * Marcado rápido para toda la clase: se elige qué marcar (religión o una autorización) y se toca a cada alumno.
 * Religión: casilla sí/no. Autorizaciones: cada toque pasa al estado siguiente, como en la ficha.
 */
export function MarcadoRapido({ onHecho }: { onHecho: () => void }) {
  const { t } = useI18n()
  const { alumnosActivos, tiposAutorizacion, setAutorizacion, guardarAlumno } = useStore()
  const etiqueta = useEtiquetaEstado()
  const [que, setQue] = useState<string>(() => tiposAutorizacion[0]?.id ?? 'religion')
  const tipo = tiposAutorizacion.find((x) => x.id === que)
  const estadoDe = (a: Alumno): EstadoAutorizacion | 'pendiente' =>
    tipo ? a.autorizaciones?.[tipo.id] ?? 'pendiente' : a.religion ? 'si' : 'pendiente'
  const cuenta = (e: EstadoAutorizacion | 'pendiente') => alumnosActivos.filter((a) => estadoDe(a) === e).length
  const tocar = (a: Alumno) => {
    if (!tipo) guardarAlumno({ ...a, religion: a.religion ? undefined : true })
    else setAutorizacion(a.id, tipo.id, (tipo.tresEstados ? SIGUIENTE_3 : SIGUIENTE_2)[estadoDe(a)])
  }
  const pendientesASi = () => {
    if (!tipo) return
    for (const a of alumnosActivos) if (estadoDe(a) === 'pendiente') setAutorizacion(a.id, tipo.id, 'si')
  }
  const opciones = [
    ...tiposAutorizacion.map((x) => ({ id: x.id, nombre: x.nombre, Icono: iconoAutorizacion(x.icono) })),
    { id: 'religion', nombre: t.religion, Icono: BookHeart },
  ]
  const estados: (EstadoAutorizacion | 'pendiente')[] = !tipo ? ['si'] : tipo.tresEstados ? ['si', 'aviatges', 'no', 'pendiente'] : ['si', 'no', 'pendiente']

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm font-semibold">{t.marcar}</p>
        <button onClick={onHecho} className="ml-auto rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent">{t.hecho}</button>
      </div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {opciones.map(({ id, nombre, Icono }) => (
          <button
            key={id}
            role="tab"
            aria-selected={que === id}
            onClick={() => setQue(id)}
            className={clsx(
              'flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm',
              que === id ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line bg-surface',
            )}
          >
            <Icono size={16} aria-hidden /> {nombre}
          </button>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {estados.map((e) => (
          <span key={e} className={clsx('font-medium', estiloEstado[e].marca)}>
            {tipo ? etiqueta(e, tipo.tresEstados) : t.haceReligion} · {cuenta(e)}
          </span>
        ))}
        {tipo && cuenta('pendiente') > 0 && (
          <button onClick={pendientesASi} className="ml-auto rounded-full border border-line px-3 py-1 text-sm">
            {t.pendientesA} → {etiqueta('si', tipo.tresEstados)}
          </button>
        )}
      </div>
      <ul className="panel-app rounded-2xl border border-line bg-surface">
        {alumnosActivos.map((a) => {
          const e = estadoDe(a)
          const Marca = e === 'si' ? Check : e === 'no' ? X : e === 'aviatges' ? Minus : null
          return (
            <li key={a.id} className="border-b border-line last:border-0">
              <button
                role={tipo ? undefined : 'checkbox'}
                aria-checked={tipo ? undefined : e === 'si'}
                aria-label={`${a.nombre} ${a.apellidos}: ${tipo ? etiqueta(e, tipo.tresEstados) : e === 'si' ? t.estadoSi : t.estadoNo}`}
                onClick={() => tocar(a)}
                className="flex min-h-12 w-full items-center gap-3 px-4 text-left active:bg-bg"
              >
                <span className={clsx('grid size-7 shrink-0 place-items-center rounded-md border', e === 'pendiente' ? 'border-line' : clsx('border-transparent', estiloEstado[e].icono))}>
                  {Marca && <Marca size={17} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{a.nombre}</span> <span className="text-muted">{a.apellidos}</span>
                </span>
                {tipo && <span className={clsx('shrink-0 text-xs font-medium', estiloEstado[e].marca)}>{etiqueta(e, tipo.tresEstados)}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">{t.tocaCambiar}</p>
    </>
  )
}
