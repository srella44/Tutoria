import { ListChecks } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { useStore } from '../data/store'
import { esClaustre, type Registro } from '../data/types'
import { useI18n } from '../lib/i18n'
import { Card } from './ui'

// Preparar: un único cuadro de texto. Se escriben o pegan los puntos numerados (seguidos o por líneas)
// y en Anotar cada punto tiene su propia ventana.
export function PuntosCita({ cita }: { cita: Registro }) {
  const { t } = useI18n()
  const { setPuntosTexto } = useStore()
  const puntos = cita.puntos ?? []
  const texto = cita.puntosTexto ?? puntos.map((p, i) => `${i + 1}. ${p.texto}`).join('\n')
  const titulo = esClaustre(cita.tipo) ? t.ordenDia : t.puntosCita
  const caja = useRef<HTMLTextAreaElement>(null)

  const cambiar = (valor: string, cursor?: number) => {
    setPuntosTexto(cita.id, valor)
    if (cursor !== undefined) requestAnimationFrame(() => caja.current?.setSelectionRange(cursor, cursor))
  }

  // Intro en una línea numerada abre la siguiente con el número que toca; en una línea numerada vacía, termina la lista.
  const alPulsar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    const { selectionStart: inicio, selectionEnd: fin, value } = e.currentTarget
    const inicioLinea = value.lastIndexOf('\n', inicio - 1) + 1
    const linea = value.slice(inicioLinea, inicio)
    const numero = linea.match(/^(\s*)(\d{1,2})([.)])\s*/)
    if (!numero) return
    e.preventDefault()
    if (linea.trim() === `${numero[2]}${numero[3]}`) {
      cambiar(value.slice(0, inicioLinea) + value.slice(fin), inicioLinea)
      return
    }
    const siguiente = `\n${numero[1]}${Number(numero[2]) + 1}${numero[3]} `
    cambiar(value.slice(0, inicio) + siguiente + value.slice(fin), inicio + siguiente.length)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="icono-seccion" data-color="menta"><ListChecks size={18} aria-hidden /></span>
        <h2 className="flex-1 font-bold">{titulo}</h2>
        {puntos.length > 0 && <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-muted">{puntos.length}</span>}
      </div>
      <div className="border-t border-line p-3">
        <textarea ref={caja} value={texto} onChange={(e) => cambiar(e.target.value)} onKeyDown={alPulsar} aria-label={titulo}
          placeholder={'1. …\n2. …\n3. …'} rows={8}
          className="block w-full rounded-xl border border-line bg-bg p-3 text-base leading-relaxed" />
      </div>
    </Card>
  )
}
