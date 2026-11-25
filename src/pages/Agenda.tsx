import { CalendarPlus, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import { diasDesdeHoy, fechaCorta, hora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Agenda() {
  const { t, lang, tipo } = useI18n()
  const { registros, acuerdos, alumnos } = useStore()
  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'

  const proximas = registros
    .filter((r) => r.programada && diasDesdeHoy(r.fecha) >= 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const revisiones = acuerdos
    .filter((a) => a.estado !== 'completado' && diasDesdeHoy(a.fechaRevision) >= 0)
    .sort((a, b) => a.fechaRevision.localeCompare(b.fechaRevision))

  return (
    <>
      <PageHeader
        title={t.agenda}
        right={
          <button disabled title={t.suscripcionIcs} className="rounded-lg p-2 text-muted opacity-50">
            <CalendarPlus size={20} />
          </button>
        }
      />
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle count={proximas.length}>{t.proximas}</SectionTitle>
        <Card>
          {proximas.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {proximas.map((r) => (
                <li key={r.id} className="border-b border-line last:border-0">
                  <Link to={`/reunion/${r.id}`} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-24 shrink-0">
                      <div className="text-sm font-semibold">{fechaCorta(r.fecha, lang)}</div>
                      <div className="text-xs text-muted">{hora(r.fecha)}</div>
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

        <SectionTitle count={revisiones.length}>{t.revisiones}</SectionTitle>
        <Card>
          {revisiones.length === 0 ? (
            <Empty>{t.nadaPendiente}</Empty>
          ) : (
            <ul>
              {revisiones.map((a) => (
                <li key={a.id} className="flex gap-3 border-b border-line px-4 py-3 last:border-0">
                  <div className="w-24 shrink-0 text-sm font-semibold">{fechaCorta(a.fechaRevision, lang)}</div>
                  <div className="min-w-0">
                    <div className="text-[15px]">{a.texto}</div>
                    <div className="text-xs text-muted">
                      {a.alumnoIds.map(nombre).join(', ')} · {a.responsable}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <p className="mt-4 px-1 text-xs text-muted">{t.suscripcionIcs}</p>
      </div>
    </>
  )
}
