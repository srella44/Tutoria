// Captura rápida: elegir alumnos, tipo, frase o texto libre, y guardar. Objetivo: 5 segundos.
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import type { TipoRegistro } from '../data/types'
import { useI18n } from '../lib/i18n'

const tiposRapidos: TipoRegistro[] = ['observacion', 'incidencia', 'comunicacion']

export function QuickCapture({ onClose, preset }: { onClose: () => void; preset?: string[] }) {
  const { t, tipo: tipoLabel } = useI18n()
  const { alumnos, frases, addRegistro } = useStore()
  const [sel, setSel] = useState<string[]>(preset ?? [])
  const [tipo, setTipo] = useState<TipoRegistro>('observacion')
  const [texto, setTexto] = useState('')

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
        aria-label={t.nuevoRegistro}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface md:max-w-lg md:rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <button onClick={onClose} className="text-muted" aria-label={t.cancelar}>
            <X size={22} />
          </button>
          <span className="font-semibold">{t.nuevoRegistro}</span>
          <button
            onClick={guardar}
            disabled={!puedeGuardar}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            {t.guardar}
          </button>
        </div>

        <div className="space-y-5 p-4">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-muted">
              {t.elegirAlumnos} {sel.length > 0 && `· ${sel.length}`}
            </legend>
            <div className="flex flex-wrap gap-2">
              {alumnos.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className={clsx(
                    'min-h-10 rounded-full border px-3.5 text-[15px]',
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

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-muted">{t.frases}</legend>
            <div className="flex flex-wrap gap-2">
              {frases.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTexto((x) => (x ? `${x} ${f.texto}` : f.texto))}
                  className="rounded-lg bg-bg px-3 py-2 text-left text-sm"
                >
                  {f.texto}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase text-muted">{t.texto}</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-line bg-bg p-3 text-base outline-none focus:border-accent"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
