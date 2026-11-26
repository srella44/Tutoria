import { Download, FileText, Plus } from 'lucide-react'
import { useId } from 'react'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'
import { Card } from './ui'

function descargarOriginal(archivo: File) {
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo.name
  enlace.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DocumentosClaustre() {
  const { t } = useI18n()
  const { documentosClaustre: documentos, addDocumentosClaustre } = useStore()
  const id = useId()

  return (
    <Card className="mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h2 className="flex items-center gap-2 font-bold">
          <FileText size={19} aria-hidden /> {t.documentosOriginales}
        </h2>
        <div>
          <input id={id} className="peer sr-only" type="file" multiple accept=".docx,.pdf"
            onChange={(e) => {
              const nuevos = Array.from(e.currentTarget.files ?? []).filter((archivo) => /\.(docx|pdf)$/i.test(archivo.name))
              addDocumentosClaustre(nuevos)
              e.currentTarget.value = ''
            }} />
          <label htmlFor={id} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent-soft px-3 text-sm font-semibold text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
            <Plus size={17} aria-hidden /> {t.anadirDocumentos}
          </label>
        </div>
      </div>
      {documentos.length > 0 && (
        <ul>
          {documentos.map((archivo, i) => (
            <li key={i} className="border-t border-line">
              <button onClick={() => descargarOriginal(archivo)} aria-label={`${t.descargarOriginal} · ${archivo.name}`}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-bg">
                <span className="min-w-0 wrap-anywhere">{archivo.name}</span>
                <Download size={18} aria-hidden className="shrink-0 text-accent" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
