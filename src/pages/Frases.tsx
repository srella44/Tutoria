// Frases frecuentes: las que aparecen en la captura rápida. Se añaden, editan, borran y ordenan.
import { ArrowDown, ArrowUp, MessageSquareQuote, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Campo, claseInput, claseTextarea, Hoja } from '../components/Hoja'
import { Card, Empty, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { FraseFrecuente } from '../data/types'
import { nombreTono, useI18n } from '../lib/i18n'

const tonos = ['logro', 'progreso', 'dificultad', 'propuesta'] as const

function FormFrase({ frase, onClose }: { frase?: FraseFrecuente; onClose: () => void }) {
  const { t, lang } = useI18n()
  const { frases, guardarFrase, borrarFrase } = useStore()
  const [texto, setTexto] = useState(frase?.texto ?? '')
  const [area, setArea] = useState(frase?.area ?? '')
  const [tono, setTono] = useState<FraseFrecuente['tono']>(frase?.tono ?? 'logro')
  const [borrar, setBorrar] = useState(false)
  const areas = [...new Set(frases.map((f) => f.area).filter(Boolean))]
  return (
    <Hoja
      titulo={frase ? t.editar : t.fraseNueva}
      onClose={onClose}
      puedeGuardar={texto.trim() !== ''}
      onGuardar={() => {
        guardarFrase({ id: frase?.id ?? crypto.randomUUID(), texto: texto.trim(), area: area.trim(), tono, orden: frase?.orden })
        onClose()
      }}
      pie={frase && (
        <button
          type="button"
          onClick={() => (borrar ? (borrarFrase(frase.id), onClose()) : setBorrar(true))}
          className={`min-h-10 rounded-xl border border-danger px-3 text-sm text-danger ${borrar ? 'bg-danger-soft font-semibold' : ''}`}
        >
          {borrar ? t.tocaConfirmar : t.borrar}
        </button>
      )}
    >
      <Campo label={t.texto}>
        <textarea autoFocus rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} className={claseTextarea} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={t.area}>
          <input list="areas-frases" value={area} onChange={(e) => setArea(e.target.value)} className={claseInput} />
          <datalist id="areas-frases">{areas.map((a) => <option key={a} value={a} />)}</datalist>
        </Campo>
        <Campo label={t.tono}>
          <select value={tono} onChange={(e) => setTono(e.target.value as FraseFrecuente['tono'])} className={claseInput}>
            {tonos.map((k) => <option key={k} value={k}>{nombreTono[lang][k]}</option>)}
          </select>
        </Campo>
      </div>
    </Hoja>
  )
}

export function Frases() {
  const { t, lang } = useI18n()
  const { frases, moverFrase } = useStore()
  const [editando, setEditando] = useState<FraseFrecuente | 'nueva'>()
  return (
    <>
      <PageHeader
        title={t.frases}
        icon={MessageSquareQuote}
        right={
          <button
            onClick={() => setEditando('nueva')}
            aria-label={t.fraseNueva}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t.fraseNueva}</span>
          </button>
        }
      />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Card>
          {frases.length === 0 ? <Empty>{t.sinRegistros}</Empty> : (
            <ul>
              {frases.map((f, i) => (
                <li key={f.id} className="flex items-center gap-1 border-b border-line py-2 pr-2 pl-4 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px]">{f.texto}</p>
                    <p className="text-xs text-muted">{[f.area, nombreTono[lang][f.tono]].filter(Boolean).join(' · ')}</p>
                  </div>
                  <button onClick={() => moverFrase(f.id, -1)} disabled={i === 0} aria-label={t.subir} className="rounded-lg p-2 text-muted disabled:opacity-30">
                    <ArrowUp size={16} />
                  </button>
                  <button onClick={() => moverFrase(f.id, 1)} disabled={i === frases.length - 1} aria-label={t.bajar} className="rounded-lg p-2 text-muted disabled:opacity-30">
                    <ArrowDown size={16} />
                  </button>
                  <button onClick={() => setEditando(f)} aria-label={t.editar} className="rounded-lg p-2 text-muted hover:bg-bg">
                    <Pencil size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {editando && <FormFrase frase={editando === 'nueva' ? undefined : editando} onClose={() => setEditando(undefined)} />}
    </>
  )
}
