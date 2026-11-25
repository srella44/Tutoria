// «Hoy»: solo lo accionable.
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RegistroItem } from '../components/RegistroItem'
import { Avatar, Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { diasDesdeHoy, fechaCorta, hora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

const DIAS_SIN_OBSERVAR = 14

export function Hoy() {
  const { t, lang, tipo, toggle } = useI18n()
  const { registros, acuerdos, alumnos } = useStore()

  const reuniones = registros
    .filter((r) => r.programada && [0, 1].includes(diasDesdeHoy(r.fecha)))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const vencen = acuerdos
    .filter((a) => a.estado !== 'completado' && diasDesdeHoy(a.fechaRevision) <= 2)
    .sort((a, b) => a.fechaRevision.localeCompare(b.fechaRevision))
  const sinFirmar = registros.filter((r) => r.estado === 'sinFirmar')
  const incidencias = registros.filter((r) => r.tipo === 'incidencia' && r.estado === 'abierto')
  const teEscoti = registros.filter((r) => r.tipo === 'teEscoti' && r.estado === 'abierto')
  const sinObs = alumnos.filter(
    (a) =>
      !registros.some(
        (r) => r.tipo === 'observacion' && r.alumnoIds.includes(a.id) && diasDesdeHoy(r.fecha) >= -DIAS_SIN_OBSERVAR,
      ),
  )
  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'

  return (
    <>
      <PageHeader
        title={t.hoy}
        right={
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{fechaCorta(new Date().toISOString(), lang)}</span>
            <button onClick={toggle} className="rounded-full border border-line px-2.5 py-0.5 text-xs md:hidden">
              {t.idioma}
            </button>
          </div>
        }
      />
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle count={reuniones.length}>{t.reunionesHoy}</SectionTitle>
        <Card>
          {reuniones.length === 0 ? (
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
            </ul>
          )}
        </Card>

        <SectionTitle count={vencen.length}>{t.acuerdosVencen}</SectionTitle>
        <Card>
          {vencen.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {vencen.map((a) => {
                const d = diasDesdeHoy(a.fechaRevision)
                return (
                  <li key={a.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${d < 0 ? 'bg-danger' : 'bg-warn'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px]">{a.texto}</div>
                      <div className="text-xs text-muted">
                        {a.alumnoIds.map(nombre).join(', ')} · {a.responsable} · {fechaCorta(a.fechaRevision, lang)}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {sinFirmar.length > 0 && (
          <>
            <SectionTitle count={sinFirmar.length}>{t.actasSinFirmar}</SectionTitle>
            <Card>
              <ul>
                {sinFirmar.map((r) => (
                  <RegistroItem key={r.id} r={r} />
                ))}
              </ul>
            </Card>
          </>
        )}

        <SectionTitle count={incidencias.length}>{t.incidenciasAbiertas}</SectionTitle>
        <Card>
          {incidencias.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {incidencias.map((r) => (
                <RegistroItem key={r.id} r={r} />
              ))}
            </ul>
          )}
        </Card>

        {teEscoti.length > 0 && (
          <>
            <SectionTitle count={teEscoti.length}>{t.teEscotiSeguimiento}</SectionTitle>
            <Card>
              <ul>
                {teEscoti.map((r) => (
                  <RegistroItem key={r.id} r={r} />
                ))}
              </ul>
            </Card>
          </>
        )}

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
