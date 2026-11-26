import { useEffect, useRef, type PointerEvent } from 'react'
import { useI18n } from '../lib/i18n'

export function FirmaPdf({ titulo, imagen, onChange }: {
  titulo: string
  imagen?: string
  onChange: (imagen?: string) => void
}) {
  const { t } = useI18n()
  const canvas = useRef<HTMLCanvasElement>(null)
  const trazo = useRef<{ id: number; x: number; y: number; movido: boolean } | null>(null)

  useEffect(() => {
    const superficie = canvas.current
    if (!superficie) return
    const ctx = superficie.getContext('2d')
    if (!ctx) return
    if (!imagen) {
      ctx.clearRect(0, 0, superficie.width, superficie.height)
      return
    }
    const firma = new Image()
    firma.onload = () => {
      ctx.clearRect(0, 0, superficie.width, superficie.height)
      ctx.drawImage(firma, 0, 0)
    }
    firma.src = imagen
    return () => { firma.onload = null }
  }, [imagen])

  function posicion(e: PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * e.currentTarget.width / rect.width,
      y: (e.clientY - rect.top) * e.currentTarget.height / rect.height,
    }
  }

  function acabar(e: PointerEvent<HTMLCanvasElement>) {
    if (trazo.current?.id !== e.pointerId) return
    const movido = trazo.current.movido
    trazo.current = null
    if (movido) onChange(e.currentTarget.toDataURL('image/png'))
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-2 font-semibold">{titulo}</h3>
      <canvas ref={canvas} width={640} height={200} aria-label={titulo}
        className="block w-full touch-none rounded-xl border border-dashed border-line bg-white"
        onPointerDown={(e) => {
          if (trazo.current || e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          trazo.current = { id: e.pointerId, ...posicion(e), movido: false }
        }}
        onPointerMove={(e) => {
          const anterior = trazo.current
          const ctx = e.currentTarget.getContext('2d')
          if (!ctx || anterior?.id !== e.pointerId) return
          const siguiente = posicion(e)
          if (Math.hypot(siguiente.x - anterior.x, siguiente.y - anterior.y) < 1) return
          ctx.beginPath()
          ctx.strokeStyle = '#132d49'
          ctx.lineWidth = 4
          ctx.lineCap = 'round'
          ctx.moveTo(anterior.x, anterior.y)
          ctx.lineTo(siguiente.x, siguiente.y)
          ctx.stroke()
          trazo.current = { id: e.pointerId, ...siguiente, movido: true }
        }}
        onPointerUp={acabar}
        onPointerCancel={acabar}
        onLostPointerCapture={acabar}
      />
      <button type="button" onClick={() => {
        const superficie = canvas.current
        superficie?.getContext('2d')?.clearRect(0, 0, superficie.width, superficie.height)
        onChange(undefined)
      }} className="mt-2 min-h-11 rounded-xl px-3 text-sm font-semibold text-accent hover:bg-bg">{t.pdfLimpiarFirma}</button>
    </div>
  )
}
