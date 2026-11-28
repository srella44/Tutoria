import { ChevronDown, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormAcuerdo, FormAher } from '../components/Formularios'
import { RegistroItem } from '../components/RegistroItem'
import { Card, Empty, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { esTarea, type Acuerdo, type Aher } from '../data/types'
import { diasDesdeHoy, fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

/** Lo pendiente: Ahèrs, incidencias, Te escoti, actas sin firmar y tareas de otros. Se muestra al pie de la Agenda. */
export function Pendents() {
  const { t, lang, tipo } = useI18n()
  const { ahers, toggleAher, acuerdos, registros } = useStore()
  const [aherEditando, setAherEditando] = useState<Aher>()
  const [acuerdoEditando, setAcuerdoEditando] = useState<Acuerdo>()
  const pendientes = ahers.filter((a) => esTarea(a) && !a.completado && !a.responsable).sort((a, b) => {
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha) || (a.hora ?? '').localeCompare(b.hora ?? '')
    return Number(Boolean(b.fecha)) - Number(Boolean(a.fecha))
  })
  const completadas = ahers.filter((a) => esTarea(a) && a.completado && !a.responsable)
  const otrasTareas = acuerdos.filter((a) => a.responsable !== 'Tutor' && a.estado !== 'completado')
  const delegadas = ahers.filter((a) => esTarea(a) && a.responsable)
  const grupos = [
    { label: t.incidencias, items: registros.filter((r) => r.tipo === 'incidencia' && r.estado === 'abierto') },
    { label: tipo.teEscoti, items: registros.filter((r) => r.tipo === 'teEscoti' && r.estado === 'abierto') },
    { label: t.actasSinFirmar, items: registros.filter((r) => r.estado === 'sinFirmar') },
  ]

  const tarea = (a: (typeof ahers)[number]) => (
    <li key={a.id} className="flex items-start border-b border-line last:border-0">
      <label className="flex min-h-12 flex-1 cursor-pointer items-start gap-3 py-3 pl-4 hover:bg-bg">
        <input type="checkbox" checked={a.completado} onChange={() => toggleAher(a.id)} className="mt-0.5 size-5 shrink-0 accent-accent" />
        <span className="min-w-0 flex-1">
          <span className={a.completado ? 'text-muted line-through' : undefined}>{a.texto}</span>
          {(a.fecha || a.responsable) && (
            <span className={`block text-xs ${!a.completado && a.fecha && diasDesdeHoy(a.fecha) < 0 ? 'text-danger' : 'text-muted'}`}>
              {[a.responsable, a.fecha && fechaCorta(a.fecha, lang), a.fecha && a.hora].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
      </label>
      <button onClick={() => setAherEditando(a)} aria-label={t.editar} className="m-2 rounded-lg p-2 text-muted hover:bg-bg">
        <Pencil size={15} />
      </button>
    </li>
  )

  return (
    <>
      <div>
        <SectionTitle count={pendientes.length}>{t.acuerdos}</SectionTitle>
        <Card>
          {pendientes.length > 0 ? <ul>{pendientes.map(tarea)}</ul> : <Empty>{t.nadaPendiente}</Empty>}
          {completadas.length > 0 && (
            <details className="border-t border-line">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{t.completadas} · {completadas.length}</summary>
              <ul>{completadas.map(tarea)}</ul>
            </details>
          )}
        </Card>

        <div className="mt-5 space-y-2">
          {grupos.map(({ label, items }) => (
            <details key={label} className="panel-app rounded-2xl border border-line bg-surface">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold">
                <span className="flex-1">{label}</span>
                <span className="text-sm text-muted">{items.length}</span>
                <ChevronDown size={16} aria-hidden />
              </summary>
              {items.length === 0 ? <Empty>{t.nadaPendiente}</Empty> : (
                <ul className="border-t border-line">
                  {items.map((r) => r.tipo === 'incidencia' ? <RegistroItem key={r.id} r={r} /> : (
                    <li key={r.id} className="border-b border-line last:border-0">
                      <Link to={`/reunion/${r.id}`} state={{ desdeTutoria: true }} className="flex gap-2 px-4 py-3 hover:bg-bg">
                        <span className="flex-1">{r.titulo || tipo[r.tipo]}</span>
                        <span className="text-sm text-muted">{fechaCorta(r.fecha, lang)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          ))}

          {otrasTareas.length + delegadas.length > 0 && (
            <details className="panel-app rounded-2xl border border-line bg-surface">
              <summary className="cursor-pointer px-4 py-3 font-semibold">{t.otrasTareas} · {otrasTareas.length + delegadas.length}</summary>
              <ul className="border-t border-line">
                {delegadas.map(tarea)}
                {otrasTareas.map((a) => (
                  <li key={a.id} className="border-b border-line last:border-0">
                    <button onClick={() => setAcuerdoEditando(a)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-bg">
                      <span className="min-w-0 flex-1">
                        {a.texto}
                        <span className="block text-xs text-muted">{a.responsable} · {fechaCorta(a.fechaRevision, lang)}</span>
                      </span>
                      <Pencil size={15} className="mt-1 text-muted" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
      {aherEditando && <FormAher aher={aherEditando} onClose={() => setAherEditando(undefined)} />}
      {acuerdoEditando && <FormAcuerdo acuerdo={acuerdoEditando} onClose={() => setAcuerdoEditando(undefined)} />}
    </>
  )
}
