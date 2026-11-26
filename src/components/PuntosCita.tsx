import { ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../data/store'
import { esClaustre, type Registro } from '../data/types'
import { useI18n } from '../lib/i18n'
import { Card } from './ui'

export function PuntosCita({ cita }: { cita: Registro }) {
  const { t } = useI18n()
  const { addPuntoCita, togglePuntoCita } = useStore()
  const [texto, setTexto] = useState('')
  const puntos = cita.puntos ?? []
  const hechos = puntos.filter((p) => p.hecho).length

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="icono-seccion" data-color="menta"><ListChecks size={18} aria-hidden /></span>
        <h2 className="flex-1 font-bold">{esClaustre(cita.tipo) ? t.ordenDia : t.puntosCita}</h2>
        {puntos.length > 0 && <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-muted">{hechos}/{puntos.length}</span>}
      </div>
      {puntos.length > 0 && (
        <ul>
          {puntos.map((p) => (
            <li key={p.id} className="border-t border-line">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-bg">
                <input type="checkbox" checked={p.hecho} onChange={() => togglePuntoCita(cita.id, p.id)} className="size-5 shrink-0 accent-accent" />
                <span className={p.hecho ? 'min-w-0 wrap-anywhere text-muted line-through' : 'min-w-0 wrap-anywhere'}>{p.texto}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(e) => {
        e.preventDefault()
        addPuntoCita(cita.id, texto)
        setTexto('')
      }} className="flex gap-2 border-t border-line p-3">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={t.nuevoPunto}
          aria-label={t.nuevoPunto} className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3" />
        <button type="submit" disabled={!texto.trim()} aria-label={t.anadirPunto}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-on-accent disabled:opacity-40">
          <Plus size={20} aria-hidden />
        </button>
      </form>
    </Card>
  )
}
