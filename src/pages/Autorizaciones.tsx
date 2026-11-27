// Gestionar la lista de autorizaciones (para todo el alumnado) y ver el recuento del grupo.
import clsx from 'clsx'
import { ArrowDown, ArrowUp, Pencil, Plus, ShieldCheck, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { estiloEstado, useEtiquetaEstado } from '../components/Autorizaciones'
import { Campo, claseInput, Hoja } from '../components/Hoja'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { TipoAutorizacion } from '../data/types'
import { ICONOS_AUTORIZACION, iconoAutorizacion } from '../lib/iconos'
import { useI18n } from '../lib/i18n'

function FormTipo({ tipo, onClose }: { tipo?: TipoAutorizacion; onClose: () => void }) {
  const { t } = useI18n()
  const { tiposAutorizacion, guardarTipoAutorizacion, borrarTipoAutorizacion } = useStore()
  const [nombre, setNombre] = useState(tipo?.nombre ?? '')
  const [icono, setIcono] = useState(tipo?.icono ?? 'escudo')
  const [tres, setTres] = useState(tipo?.tresEstados ?? false)
  const [borrar, setBorrar] = useState(false)
  return (
    <Hoja
      titulo={tipo ? t.editar : t.autorizacionNueva}
      onClose={onClose}
      puedeGuardar={nombre.trim() !== ''}
      onGuardar={() => {
        guardarTipoAutorizacion({ id: tipo?.id ?? crypto.randomUUID(), nombre: nombre.trim(), icono, orden: tipo?.orden ?? tiposAutorizacion.length, tresEstados: tres || undefined })
        onClose()
      }}
      pie={tipo && (
        <button type="button" onClick={() => (borrar ? (borrarTipoAutorizacion(tipo.id), onClose()) : setBorrar(true))}
          className={clsx('min-h-10 rounded-xl border border-danger px-3 text-sm text-danger', borrar && 'bg-danger-soft font-semibold')}>
          {borrar ? t.tocaConfirmar : t.borrar}
        </button>
      )}
    >
      <Campo label={t.nombre}>
        <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} />
      </Campo>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={tres} onChange={(e) => setTres(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
        <span>{t.tresOpciones}</span>
      </label>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase text-muted">{t.icono}</legend>
        <div className="grid grid-cols-8 gap-2">
          {Object.entries(ICONOS_AUTORIZACION).map(([clave, Icono]) => (
            <button key={clave} type="button" onClick={() => setIcono(clave)} aria-label={clave}
              className={clsx('grid aspect-square place-items-center rounded-xl border', icono === clave ? 'border-accent bg-accent text-on-accent' : 'border-line text-muted')}>
              <Icono size={20} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>
    </Hoja>
  )
}

export function Autorizaciones() {
  const { t } = useI18n()
  const { tiposAutorizacion, moverTipoAutorizacion, alumnosActivos } = useStore()
  const etiqueta = useEtiquetaEstado()
  const [editando, setEditando] = useState<TipoAutorizacion | 'nueva'>()
  return (
    <>
      <PageHeader
        title={t.autorizaciones}
        icon={ShieldCheck}
        right={
          <>
          <Link to="/autorizaciones/importar" aria-label={t.importarAutorizaciones} title={t.importarAutorizaciones} className="rounded-lg p-2 text-muted hover:bg-bg">
            <Upload size={20} />
          </Link>
          <button onClick={() => setEditando('nueva')} aria-label={t.autorizacionNueva}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent">
            <Plus size={16} /> <span className="hidden sm:inline">{t.autorizacionNueva}</span>
          </button>
          </>
        }
      />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Card>
          <ul>
            {tiposAutorizacion.map((tipo, i) => {
              const Icono = iconoAutorizacion(tipo.icono)
              // Recuento del grupo, como en el control en papel.
              const cuenta = { si: 0, aviatges: 0, no: 0, pendiente: 0 }
              alumnosActivos.forEach((a) => { cuenta[a.autorizaciones?.[tipo.id] ?? 'pendiente']++ })
              return (
                <li key={tipo.id} className="flex items-center gap-2 border-b border-line py-2 pr-2 pl-4 last:border-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Icono size={20} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{tipo.nombre}</p>
                    <p className="flex flex-wrap gap-x-2 text-xs">
                      {(['si', 'aviatges', 'no', 'pendiente'] as const).filter((k) => cuenta[k] > 0).map((k) => (
                        <span key={k} className={estiloEstado[k].marca}>
                          {etiqueta(k, tipo.tresEstados)} {cuenta[k]}
                        </span>
                      ))}
                    </p>
                  </div>
                  <button onClick={() => moverTipoAutorizacion(tipo.id, -1)} disabled={i === 0} aria-label={t.subir} className="rounded-lg p-2 text-muted disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button onClick={() => moverTipoAutorizacion(tipo.id, 1)} disabled={i === tiposAutorizacion.length - 1} aria-label={t.bajar} className="rounded-lg p-2 text-muted disabled:opacity-30"><ArrowDown size={16} /></button>
                  <button onClick={() => setEditando(tipo)} aria-label={t.editar} className="rounded-lg p-2 text-muted hover:bg-bg"><Pencil size={16} /></button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
      {editando && <FormTipo tipo={editando === 'nueva' ? undefined : editando} onClose={() => setEditando(undefined)} />}
    </>
  )
}
