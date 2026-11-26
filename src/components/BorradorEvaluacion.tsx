import { useState } from 'react'
import { Card } from './ui'
import type { Registro } from '../data/types'
import { fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function BorradorEvaluacion({ nombre, registros }: { nombre: string; registros: Registro[] }) {
  const { t, lang } = useI18n()
  const [trimestre, setTrimestre] = useState('')
  const [seleccion, setSeleccion] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const evidencias = registros.filter((r) => r.tipo === 'observacion' && r.visibilidad !== 'protegido' && r.texto.trim())

  const preparar = () => {
    const elegidas = evidencias.filter((r) => seleccion.includes(r.id))
    setTexto([
      [t.dadesAval, nombre, trimestre.trim()].filter(Boolean).join(' · '),
      elegidas.map((r) => `• ${r.texto.trim()} (${fechaCorta(r.fecha, lang)})`).join('\n'),
      `${t.proximosPasos}:\n`,
    ].filter(Boolean).join('\n\n'))
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-bold">{t.dadesAval}</h2>
      <label className="block text-sm font-semibold">{t.informesTrimestre}
        <input value={trimestre} onChange={(e) => setTrimestre(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2" />
      </label>
      {evidencias.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold">{t.elegirEvidencias}</legend>
          <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
            {evidencias.map((r) => (
              <label key={r.id} className="flex min-h-11 gap-2 rounded-lg bg-bg px-2 py-2 text-sm">
                <input type="checkbox" className="mt-1 size-4 shrink-0 accent-accent" checked={seleccion.includes(r.id)}
                  onChange={() => setSeleccion((ids) => ids.includes(r.id) ? ids.filter((id) => id !== r.id) : [...ids, r.id])} />
                <span>{r.texto} <span className="text-xs text-muted">· {fechaCorta(r.fecha, lang)}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : <p className="text-sm text-muted">{t.faltanEvidencias}</p>}
      <button type="button" disabled={!seleccion.length} onClick={preparar}
        className="accion-coral min-h-11 rounded-xl px-4 font-semibold disabled:opacity-40">{t.prepararBorrador}</button>
      {texto && (
        <>
          <textarea aria-label={t.dadesAval} value={texto} onChange={(e) => setTexto(e.target.value)}
            rows={9} className="block w-full rounded-xl border border-line bg-bg p-3" />
          <button type="button" className="min-h-11 rounded-xl border border-line px-3 text-sm font-semibold text-accent"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }))
              const enlace = document.createElement('a')
              enlace.href = url
              enlace.download = 'Tutoria-borrador.txt'
              enlace.click()
              window.setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}>{t.descargarBorrador}</button>
        </>
      )}
    </Card>
  )
}
