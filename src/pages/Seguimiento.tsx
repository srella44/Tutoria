import { ChevronDown, ListChecks, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RegistroItem } from '../components/RegistroItem'
import { Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { diasDesdeHoy, fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Seguimiento() {
  const { t, lang, tipo } = useI18n()
  const { ahers, addAher, toggleAher, acuerdos, registros } = useStore()
  const [texto, setTexto] = useState('')
  const [fecha, setFecha] = useState('')
  const pendientes = ahers.filter((a) => !a.completado && !a.responsable).sort((a, b) => {
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha)
    return Number(Boolean(b.fecha)) - Number(Boolean(a.fecha))
  })
  const completadas = ahers.filter((a) => a.completado && !a.responsable)
  const otrasTareas = acuerdos.filter((a) => a.responsable !== 'Tutor' && a.estado !== 'completado')
  const delegadas = ahers.filter((a) => a.responsable)
  const grupos = [
    { label: t.incidencias, items: registros.filter((r) => r.tipo === 'incidencia' && r.estado === 'abierto') },
    { label: tipo.teEscoti, items: registros.filter((r) => r.tipo === 'teEscoti' && r.estado === 'abierto') },
    { label: t.actasSinFirmar, items: registros.filter((r) => r.estado === 'sinFirmar') },
  ]

  const tarea = (a: (typeof ahers)[number]) => (
    <li key={a.id} className="border-b border-line last:border-0">
      <label className="flex min-h-12 cursor-pointer items-start gap-3 px-4 py-3 hover:bg-bg">
        <input type="checkbox" checked={a.completado} onChange={() => toggleAher(a.id)} className="mt-0.5 size-5 shrink-0 accent-accent" />
        <span className="min-w-0 flex-1">
          <span className={a.completado ? 'text-muted line-through' : undefined}>{a.texto}</span>
          {(a.fecha || a.responsable) && (
            <span className={`block text-xs ${!a.completado && a.fecha && diasDesdeHoy(a.fecha) < 0 ? 'text-danger' : 'text-muted'}`}>
              {[a.responsable, a.fecha && fechaCorta(a.fecha, lang)].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>
      </label>
    </li>
  )

  return (
    <>
      <PageHeader title={t.seguimiento} icon={ListChecks} color="coral" />
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle count={pendientes.length}>{t.acuerdos}</SectionTitle>
        <Card>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const contenido = texto.trim()
              if (!contenido) return
              addAher(contenido, fecha || undefined)
              setTexto('')
              setFecha('')
            }}
            className="flex flex-wrap items-end gap-2 border-b border-line p-3"
          >
            <label className="min-w-36 flex-1">
              <span className="block text-xs font-semibold text-muted">{t.nuevoAher}</span>
              <input value={texto} onChange={(e) => setTexto(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-3" required />
            </label>
            <label className="shrink-0">
              <span className="block text-xs font-semibold text-muted">{t.fechaTarea}</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 h-11 rounded-xl border border-line bg-bg px-2" />
            </label>
            <button type="submit" disabled={!texto.trim()} className="grid size-11 place-items-center rounded-xl bg-accent text-on-accent disabled:opacity-40" aria-label={t.nuevoAher}>
              <Plus size={20} />
            </button>
          </form>
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
                  <li key={a.id} className="border-b border-line px-4 py-3 last:border-0">
                    {a.texto}
                    <p className="text-xs text-muted">{a.responsable} · {fechaCorta(a.fechaRevision, lang)}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </>
  )
}
