// Modo reunión: asistente a pantalla completa. Fase 0 = navegable; firma y PDF llegan en la Fase 3.
import clsx from 'clsx'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RegistroItem } from '../components/RegistroItem'
import { Card, Empty } from '../components/ui'
import { useStore } from '../data/store'
import { fechaHora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Reunion() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t, lang, tipo } = useI18n()
  const { registros, acuerdos, alumnos, contactos, profesionales } = useStore()
  const [paso, setPaso] = useState(0)
  const [notas, setNotas] = useState('')
  const r = registros.find((x) => x.id === id)
  if (!r) return <Empty>404</Empty>

  const pasos = [t.preparar, t.anotar, t.acta, t.firmas, t.pdf]
  const nombres = r.alumnoIds.map((a) => alumnos.find((x) => x.id === a)?.nombre).join(', ')
  const asistentes = (r.asistentes ?? []).map(
    (a) => contactos.find((c) => c.id === a)?.nombre ?? profesionales.find((p) => p.id === a)?.nombre ?? a,
  )
  const relacionados = registros.filter((x) => x.id !== r.id && x.alumnoIds.some((a) => r.alumnoIds.includes(a)))
  const ultima = relacionados
    .filter((x) => x.tipo === r.tipo && !x.programada && x.fecha < r.fecha)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
  const obsDesde = relacionados.filter(
    (x) => x.tipo === 'observacion' && (!ultima || x.fecha > ultima.fecha) && x.fecha < r.fecha,
  )
  const pendientes = acuerdos.filter(
    (a) => a.estado !== 'completado' && a.alumnoIds.some((x) => r.alumnoIds.includes(x)),
  )

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-bg">
      <header className="pt-safe border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button onClick={() => nav(-1)} aria-label={t.cancelar} className="text-muted">
            <X size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{nombres}</div>
            <div className="truncate text-xs text-muted">
              {tipo[r.tipo]} · {fechaHora(r.fecha, lang)}
            </div>
          </div>
        </div>
        <ol className="mx-auto flex max-w-3xl gap-1 px-4 pb-2">
          {pasos.map((p, i) => (
            <li key={p} className="flex-1">
              <button onClick={() => setPaso(i)} className="w-full text-left">
                <div className={clsx('h-1 rounded-full', i <= paso ? 'bg-accent' : 'bg-line')} />
                <div className={clsx('mt-1 truncate text-[11px]', i === paso ? 'font-semibold text-accent' : 'text-muted')}>
                  {p}
                </div>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
          {paso === 0 && (
            <>
              {asistentes.length > 0 && <p className="text-sm text-muted">{asistentes.join(' · ')}</p>}
              <h3 className="text-[13px] font-semibold uppercase text-muted">{t.ultimaReunion}</h3>
              <Card>{ultima ? <ul><RegistroItem r={ultima} showAlumnos={false} /></ul> : <Empty>—</Empty>}</Card>
              <h3 className="text-[13px] font-semibold uppercase text-muted">{t.acuerdosPendientes}</h3>
              <Card>
                {pendientes.length === 0 ? (
                  <Empty>{t.nadaPendiente}</Empty>
                ) : (
                  <ul>
                    {pendientes.map((a) => (
                      <li key={a.id} className="border-b border-line px-4 py-3 last:border-0">
                        {a.texto} <span className="text-xs text-muted">· {a.responsable}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <h3 className="text-[13px] font-semibold uppercase text-muted">{t.observacionesDesde}</h3>
              <Card>
                {obsDesde.length === 0 ? (
                  <Empty>{t.sinRegistros}</Empty>
                ) : (
                  <ul>
                    {obsDesde.map((o) => (
                      <RegistroItem key={o.id} r={o} />
                    ))}
                  </ul>
                )}
              </Card>
            </>
          )}

          {paso === 1 && (
            <textarea
              autoFocus
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={14}
              className="w-full rounded-2xl border border-line bg-surface p-4 text-base outline-none focus:border-accent"
            />
          )}

          {paso === 2 && (
            <Card className="p-5">
              <p className="mb-3 text-xs uppercase text-muted">{t.acta} · {tipo[r.tipo]}</p>
              <p className="mb-2 font-semibold">{nombres}</p>
              <p className="mb-4 text-sm text-muted">{fechaHora(r.fecha, lang)} · {asistentes.join(', ')}</p>
              <p className="whitespace-pre-wrap text-[15px]">{notas || '—'}</p>
              <p className="mt-6 text-xs text-muted">{t.proximamente}</p>
            </Card>
          )}

          {paso >= 3 && (
            <Card>
              <Empty>{t.proximamente}</Empty>
            </Card>
          )}
        </div>
      </div>

      <footer className="pb-safe border-t border-line bg-surface">
        <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3">
          <button
            disabled={paso === 0}
            onClick={() => setPaso((p) => p - 1)}
            className="flex-1 rounded-xl border border-line py-3 font-medium disabled:opacity-40"
          >
            {t.anterior}
          </button>
          <button
            disabled={paso === pasos.length - 1}
            onClick={() => setPaso((p) => p + 1)}
            className="flex-1 rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-40 dark:text-black"
          >
            {t.siguiente}
          </button>
        </div>
      </footer>
    </div>
  )
}
