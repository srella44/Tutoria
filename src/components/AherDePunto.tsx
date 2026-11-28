import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'

export function AherDePunto({ citaId, puntoId, asunto }: { citaId: string; puntoId: string; asunto: string }) {
  const { t } = useI18n()
  const { ahers, addAher } = useStore()
  const [texto, setTexto] = useState(asunto)
  const [fecha, setFecha] = useState('')
  const [delegado, setDelegado] = useState(false)
  const [responsable, setResponsable] = useState('')
  const creado = ahers.some((a) => a.origen?.citaId === citaId && a.origen?.puntoId === puntoId)

  if (creado) return <Link to="/agenda" className="block px-4 pb-3 text-sm font-semibold text-accent">{t.aherPuntoGuardado} · {t.agenda}</Link>

  const campo = 'mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-base'

  return (
    <details className="mx-4 mb-4 rounded-xl border border-line">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-accent">{t.crearAherPunto}</summary>
      <form className="grid gap-3 p-3 sm:grid-cols-2" onSubmit={(e) => {
        e.preventDefault()
        if (!texto.trim() || (delegado && !responsable.trim())) return
        addAher(texto.trim(), fecha || undefined, {
          origen: { citaId, puntoId },
          responsable: delegado ? responsable.trim() : undefined,
        })
      }}>
        <label className="text-sm sm:col-span-2">{t.nuevoAher}
          <input value={texto} onChange={(e) => setTexto(e.target.value)} required className={campo} />
        </label>
        <label className="text-sm">{t.responsable}
          <select value={delegado ? 'otra' : 'yo'} onChange={(e) => setDelegado(e.target.value === 'otra')} className={campo}>
            <option value="yo">{t.paraMi}</option>
            <option value="otra">{t.otraPersona}</option>
          </select>
        </label>
        <label className="text-sm">{t.fechaTarea}
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
        </label>
        {delegado && <label className="text-sm sm:col-span-2">{t.responsable}
          <input value={responsable} onChange={(e) => setResponsable(e.target.value)} required className={campo} />
        </label>}
        <button type="submit" className="accion-coral min-h-11 rounded-xl px-3 font-semibold sm:col-span-2">{t.guardar}</button>
      </form>
    </details>
  )
}
