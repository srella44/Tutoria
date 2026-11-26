// Captura rápida: elegir alumnos, tipo, frase o texto libre, y guardar. Objetivo: 5 segundos.
import clsx from 'clsx'
import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import type { TipoRegistro } from '../data/types'
import { useI18n } from '../lib/i18n'

const tiposRapidos: TipoRegistro[] = ['observacion', 'incidencia', 'comunicacion']

export function QuickCapture({ onClose, preset }: { onClose: () => void; preset?: string[] }) {
  const { t, tipo: tipoLabel } = useI18n()
  const { alumnosActivos: alumnos, frases, addRegistro } = useStore()
  const [sel, setSel] = useState<string[]>(preset ?? [])
  const [tipo, setTipo] = useState<TipoRegistro>('observacion')
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const consulta = busqueda.trim().toLocaleLowerCase()
  const visibles = alumnos.filter((a) =>
    sel.includes(a.id) || `${a.nombre} ${a.apellidos}`.toLocaleLowerCase().includes(consulta),
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const puedeGuardar = sel.length > 0 && texto.trim().length > 0

  const guardar = () => {
    if (!puedeGuardar) return
    addRegistro({
      tipo,
      fecha: new Date().toISOString(),
      alumnoIds: sel,
      texto: texto.trim(),
      etiquetas: [],
      visibilidad: 'normal',
      estado: tipo === 'incidencia' ? 'abierto' : undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.nuevoRegistro}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface md:max-w-lg md:rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <button onClick={onClose} className="grid size-11 place-items-center rounded-full text-muted hover:bg-bg" aria-label={t.cancelar}>
            <X size={22} />
          </button>
          <span className="font-semibold">{t.nuevoRegistro}</span>
          <button
            onClick={guardar}
            disabled={!puedeGuardar}
            className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            {t.guardar}
          </button>
        </div>

        <div className="space-y-5 p-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase text-muted">{t.texto}</span>
            <textarea
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-line bg-bg p-3 text-base focus:border-accent focus:outline-2 focus:outline-accent"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-muted">
              {t.elegirAlumnos} {sel.length > 0 && `· ${sel.length}`}
            </legend>
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-line bg-bg px-3 focus-within:border-accent">
              <Search size={17} className="text-muted" aria-hidden />
              <input
                type="search"
                aria-label={t.buscarAlumnos}
                placeholder={t.buscar}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="min-h-11 min-w-0 flex-1 bg-transparent outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {visibles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  aria-pressed={sel.includes(a.id)}
                  className={clsx(
                    'min-h-11 rounded-full border px-3.5 text-[15px]',
                    sel.includes(a.id) ? 'border-accent bg-accent text-on-accent' : 'border-line',
                  )}
                >
                  {a.nombre}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-muted">{t.tipo}</legend>
            <div className="grid grid-cols-3 gap-2">
              {tiposRapidos.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTipo(tp)}
                  aria-pressed={tipo === tp}
                  className={clsx(
                    'min-h-11 rounded-xl border px-2 text-sm',
                    tipo === tp ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line',
                  )}
                >
                  {tipoLabel[tp]}
                </button>
              ))}
            </div>
          </fieldset>

          <details className="rounded-xl border border-line px-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
              {t.frases} <ChevronDown size={17} aria-hidden />
            </summary>
            <div className="flex flex-wrap gap-2 pb-3">
              {frases.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTexto((x) => (x ? `${x} ${f.texto}` : f.texto))}
                  className="min-h-11 rounded-lg bg-bg px-3 py-2 text-left text-sm hover:bg-accent-soft"
                >
                  {f.texto}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
