// «Uei»: lo de hoy. Tres bloques: hoy y mañana, pendientes, alumnos sin observar.
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RegistroItem } from '../components/RegistroItem'
import { Avatar, Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { diasDesdeHoy, fechaCorta, hora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

const DIAS_SIN_OBSERVAR = 14

export function Hoy() {
  const { t, lang, tipo } = useI18n()
  const { registros, acuerdos, alumnos } = useStore()
  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'

  const reuniones = registros
    .filter((r) => r.programada && [0, 1].includes(diasDesdeHoy(r.fecha)))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const vencen = acuerdos
    .filter((a) => a.estado !== 'completado' && diasDesdeHoy(a.fechaRevision) <= 1)
    .sort((a, b) => a.fechaRevision.localeCompare(b.fechaRevision))
  const pendientes = registros
    .filter(
      (r) =>
        r.estado === 'sinFirmar' ||
        ((r.tipo === 'incidencia' || r.tipo === 'teEscoti') && r.estado === 'abierto'),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const sinObs = alumnos.filter(
    (a) =>
      !registros.some(
        (r) => r.tipo === 'observacion' && r.alumnoIds.includes(a.id) && diasDesdeHoy(r.fecha) >= -DIAS_SIN_OBSERVAR,
      ),
  )
  const totalHoy = reuniones.length + vencen.length

  return (
    <>
      <PageHeader
        title={t.hoy}
        right={<span className="text-sm text-muted">{fechaCorta(new Date().toISOString(), lang)}</span>}
      />
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle count={totalHoy}>{t.hoyYManana}</SectionTitle>
        <Card>
          {totalHoy === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {reuniones.map((r) => (
                <li key={r.id} className="border-b border-line last:border-0">
                  <Link to={`/reunion/${r.id}`} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-14 text-center">
                      <div className="text-lg font-semibold">{hora(r.fecha)}</div>
                      <div className="text-[11px] uppercase text-muted">
                        {diasDesdeHoy(r.fecha) === 0 ? t.hoyTxt : t.mananaTxt}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-muted">{tipo[r.tipo]}</div>
                      <div className="truncate font-medium">{r.alumnoIds.map(nombre).join(', ')}</div>
                    </div>
                    <ChevronRight size={18} className="text-muted" />
                  </Link>
                </li>
              ))}
              {vencen.map((a) => {
                const d = diasDesdeHoy(a.fechaRevision)
                return (
                  <li key={a.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                    <div className="w-14 text-center">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[11px] font-medium',
                          d < 0 ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn',
                        )}
                      >
                        {d < 0 ? t.vencido : d === 0 ? t.hoyTxt : t.mananaTxt}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-muted">{t.acuerdos}</div>
                      <div className="text-[15px]">{a.texto}</div>
                      <div className="text-xs text-muted">
                        {a.alumnoIds.map(nombre).join(', ')} · {a.responsable}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <SectionTitle count={pendientes.length}>{t.pendientes}</SectionTitle>
        <Card>
          {pendientes.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {pendientes.map((r) => (
                <RegistroItem key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>

        <SectionTitle count={sinObs.length}>{t.sinObservaciones}</SectionTitle>
        <Card className="p-3">
          {sinObs.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sinObs.map((a) => (
                <Link
                  key={a.id}
                  to={`/alumnado/${a.id}`}
                  className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm"
                >
                  <Avatar nombre={a.nombre} apellidos={a.apellidos} size={26} />
                  {a.nombre}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
