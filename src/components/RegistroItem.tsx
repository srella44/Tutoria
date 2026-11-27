import { Check, Download, Lock, Pencil, RotateCcw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import type { Registro } from '../data/types'
import { descargarPdf } from '../lib/actas'
import { fechaHora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'
import { FormRegistro } from './Formularios'
import { TipoChip, VisChip } from './ui'

export function RegistroItem({ r, showAlumnos = true }: { r: Registro; showAlumnos?: boolean }) {
  const { t, lang, tipo } = useI18n()
  const { alumnos, guardarRegistro, actas } = useStore()
  const ultimaActa = actas.filter((a) => a.registroId === r.id).sort((a, b) => b.version - a.version)[0]
  const [editando, setEditando] = useState(false)
  const nombres = r.alumnoIds.map((id) => alumnos.find((a) => a.id === id)).filter(Boolean)
  const protegido = r.visibilidad === 'protegido'
  // Las citas (programadas) se editan desde su ficha; los protegidos, tras el desbloqueo (fase 2).
  const editable = !protegido && !r.programada

  return (
    <li className="border-b border-line px-4 py-3 last:border-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <TipoChip tipo={r.tipo} label={tipo[r.tipo]} />
        <VisChip vis={r.visibilidad} labels={t} />
        {r.tipo === 'incidencia' && r.estado === 'cerrado' && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{t.cerrada}</span>
        )}
        {ultimaActa && (
          <button
            type="button"
            onClick={() => descargarPdf(ultimaActa.pdf, ultimaActa.nombre)}
            title={`${t.huella}: ${ultimaActa.huella}`}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
          >
            <ShieldCheck size={12} aria-hidden /> {t.actaFirmada} · v{ultimaActa.version} <Download size={12} aria-hidden />
          </button>
        )}
        <span className="ml-auto text-xs text-muted">{fechaHora(r.fecha, lang)}</span>
        {editable && (
          <button onClick={() => setEditando(true)} aria-label={t.editar} title={t.editar} className="-my-1 rounded-lg p-1.5 text-muted hover:bg-bg">
            <Pencil size={15} />
          </button>
        )}
      </div>
      {showAlumnos && (
        <p className="text-sm font-medium">
          {nombres.map((a, i) => (
            <span key={a!.id}>
              {i > 0 && ', '}
              <Link to={`/alumnado/${a!.id}`} className="hover:underline">
                {a!.nombre}
              </Link>
            </span>
          ))}
        </p>
      )}
      {/* Los registros protegidos ocultan el texto hasta el desbloqueo extra (Fase 2). */}
      {protegido ? (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock size={14} /> ••••••
        </p>
      ) : (
        <p className="text-[15px] leading-snug">{r.texto}</p>
      )}
      {editable && r.tipo === 'incidencia' && (
        <button
          onClick={() => guardarRegistro({ ...r, estado: r.estado === 'cerrado' ? 'abierto' : 'cerrado' })}
          className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm"
        >
          {r.estado === 'cerrado' ? <><RotateCcw size={14} aria-hidden /> {t.reabrir}</> : <><Check size={14} aria-hidden /> {t.cerrar}</>}
        </button>
      )}
      {editando && <FormRegistro registro={r} onClose={() => setEditando(false)} />}
    </li>
  )
}
