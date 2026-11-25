import clsx from 'clsx'
import { useState } from 'react'
import { RegistroItem } from '../components/RegistroItem'
import { Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import type { EstadoAcuerdo } from '../data/types'
import { diasDesdeHoy, fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Seguimiento() {
  const { t, lang, tipo } = useI18n()
  const { acuerdos, registros, alumnos } = useStore()
  const [estado, setEstado] = useState<EstadoAcuerdo | 'todos'>('todos')
  const [alumno, setAlumno] = useState('todos')
  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'
  const porAlumno = (ids: string[]) => alumno === 'todos' || ids.includes(alumno)

  const estadoLabel: Record<EstadoAcuerdo, string> = {
    pendiente: t.pendiente,
    seguimiento: t.enSeguimiento,
    completado: t.completado,
  }
  const lista = acuerdos.filter((a) => (estado === 'todos' || a.estado === estado) && porAlumno(a.alumnoIds))
  const abiertos = registros.filter(
    (r) => (r.tipo === 'incidencia' || r.tipo === 'teEscoti') && r.estado === 'abierto' && porAlumno(r.alumnoIds),
  )

  return (
    <>
      <PageHeader title={t.seguimiento} />
      <div className="mx-auto max-w-3xl px-4 pt-3">
        <div className="flex flex-wrap gap-2">
          {(['todos', 'pendiente', 'seguimiento', 'completado'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setEstado(k)}
              className={clsx(
                'rounded-full border px-3 py-1 text-sm',
                estado === k ? 'border-accent bg-accent text-on-accent' : 'border-line',
              )}
            >
              {k === 'todos' ? t.todos : estadoLabel[k]}
            </button>
          ))}
          <select
            value={alumno}
            onChange={(e) => setAlumno(e.target.value)}
            className="ml-auto rounded-full border border-line bg-surface px-3 py-1 text-sm"
          >
            <option value="todos">{t.alumnado}: {t.todos}</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <SectionTitle count={lista.length}>{t.acuerdos}</SectionTitle>
        <Card>
          {lista.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {lista.map((a) => {
                const vencido = a.estado !== 'completado' && diasDesdeHoy(a.fechaRevision) < 0
                return (
                  <li key={a.id} className="border-b border-line px-4 py-3 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className={clsx(a.estado === 'completado' && 'text-muted line-through')}>{a.texto}</span>
                      <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[11px]">{estadoLabel[a.estado]}</span>
                    </div>
                    <div className={clsx('text-xs', vencido ? 'text-danger' : 'text-muted')}>
                      {a.alumnoIds.map(nombre).join(', ')} · {t.responsable}: {a.responsable} · {t.revision}{' '}
                      {fechaCorta(a.fechaRevision, lang)}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <SectionTitle count={abiertos.length}>
          {t.incidencias} · {tipo.teEscoti}
        </SectionTitle>
        <Card>
          {abiertos.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {abiertos.map((r) => (
                <RegistroItem key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
