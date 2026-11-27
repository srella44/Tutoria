// Paso PDF del acta propia: genera el PDF «popurrí» y lo guarda con versiones (como las hojas oficiales, sin firmas).
import { Download, FileDown, FileText } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../data/store'
import { citaRealizada, type Registro } from '../data/types'
import { aBase64, descargarPdf, huella, huellaCorta, LIMITE_SYNC_PDF } from '../lib/actas'
import { useI18n } from '../lib/i18n'
import { generarActaPropia } from '../lib/pdfActaPropia'
import { BorrarVersion } from './HuelhaOficial'
import { Card } from './ui'

export function PdfActaPropia({ cita, titulo, lineas }: { cita: Registro; titulo: string; lineas: string[] }) {
  const { t } = useI18n()
  const { actas, ahers, curso, guardarActaPropia, borrarActa } = useStore()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const versiones = actas.filter((a) => a.registroId === cita.id).sort((a, b) => b.version - a.version)

  const crear = async () => {
    setOcupado(true)
    setError('')
    try {
      const tareas = ahers.filter((a) => a.origen?.citaId === cita.id)
      const bytes = await generarActaPropia({
        titulo,
        lineas,
        puntos: (cita.puntos ?? []).map((p) => ({ titulo: p.texto, notas: p.notas ?? '' })),
        notasGenerales: { titulo: t.notasGenerales, texto: cita.texto },
        ahers: { titulo: t.acuerdos, items: tareas.map((a) => ({
          texto: a.texto,
          hecho: a.completado,
          detalle: [a.responsable || t.paraMi, a.fecha && new Date(`${a.fecha.slice(0, 10)}T12:00`).toLocaleDateString('es-ES')].filter(Boolean).join(' · '),
        })) },
        logo: curso.logo,
        sello: citaRealizada(cita),
        pie: 'Tutoria',
      })
      const version = (versiones[0]?.version ?? 0) + 1
      const ahora = new Date()
      const base = `${titulo} - ${new Date(cita.fecha).toLocaleDateString('es-ES').replace(/\//g, '-')}`.replace(/[\\/:*?"<>|]/g, '')
      guardarActaPropia({
        id: crypto.randomUUID(), registroId: cita.id, version, fecha: ahora.toISOString(),
        huella: await huella(bytes), firmantes: [], nombre: `${base} - v${version}.pdf`, pdf: aBase64(bytes),
      })
      if (bytes.length > LIMITE_SYNC_PDF) setError(t.actaGrandeSinSync)
    } catch {
      setError(t.pdfError)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Card className="acta-acciones space-y-4 p-4">
      <p className="text-sm text-muted">{t.abrirPdfActa}</p>
      <button type="button" disabled={ocupado} onClick={() => void crear()}
        className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-40">
        <FileDown size={19} aria-hidden /> {t.crearPdfActa}
      </button>
      {versiones.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {versiones.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <FileText size={18} className="shrink-0 text-accent" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.version} {v.version} · {new Date(v.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <p className="truncate font-mono text-xs text-muted" title={v.huella}>{t.huella}: {huellaCorta(v.huella)}</p>
              </div>
              <button type="button" onClick={() => descargarPdf(v.pdf, v.nombre)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-accent px-3 text-sm font-semibold text-accent">
                <Download size={16} aria-hidden /> PDF
              </button>
              <BorrarVersion onBorrar={() => borrarActa(v.id)} />
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
    </Card>
  )
}
