// Modo reunión: asistente a pantalla completa. Fase 0 = navegable; firma y PDF llegan en la Fase 3.
import clsx from 'clsx'
import { CalendarPlus, FileDown, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ActaInterna, NotasInternas } from '../components/ActaInterna'
import { ControlGoogleCalendar } from '../components/ControlGoogleCalendar'
import { EstadoCita } from '../components/EstadoCita'
import { HuelhaOficial } from '../components/HuelhaOficial'
import { PuntosCita } from '../components/PuntosCita'
import { RegistroItem } from '../components/RegistroItem'
import { Card, Empty } from '../components/ui'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre } from '../data/types'
import { descargarCalendario } from '../lib/calendario'
import { fechaHora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

export function Reunion() {
  const { id } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const { t, lang, tipo } = useI18n()
  const { registros, borradoresListos, acuerdos, alumnos, contactos, profesionales, setTextoRegistro } = useStore()
  const [paso, setPaso] = useState(0)
  const r = registros.find((x) => x.id === id)
  if (!r) return <Empty>{borradoresListos ? '404' : t.pdfCargando}</Empty>

  const interna = esClaustre(r.tipo)
  const pasos = interna ? [t.preparar, t.anotar, t.acta, t.pdf] : [t.preparar, t.anotar, t.acta, t.firmas, t.pdf]
  const modelo = r.tipo === 'reunionFamilia' ? 'familia' : r.tipo === 'teEscoti' ? 'escoti' : undefined
  const protegido = r.visibilidad === 'protegido'
  const cerrar = () => location.state?.desdeTutoria ? nav(-1) : nav(interna ? '/claustre' : '/reuniones', { replace: true })
  const nombres = [
    ...r.alumnoIds.map((a) => alumnos.find((x) => x.id === a)?.nombre),
    ...(r.alumnosOtrosCursos ?? []).map((a) => `${a.nombre} (${a.curso})`),
  ].filter(Boolean).join(', ')
  const titulo = r.titulo || (interna ? tipo[r.tipo] : nombres || tipo[r.tipo])
  const asistentes = (r.asistentes ?? []).map(
    (a) => contactos.find((c) => c.id === a)?.nombre ?? profesionales.find((p) => p.id === a)?.nombre ?? a,
  )
  const alumnoCita = alumnos.find((a) => a.id === r.alumnoIds[0])
  const relacionados = registros.filter((x) => x.id !== r.id && (interna ? x.tipo === r.tipo : x.alumnoIds.some((a) => r.alumnoIds.includes(a))))
  const anteriores = relacionados
    .filter((x) => x.tipo === r.tipo && citaRealizada(x) && Date.parse(x.fecha) < Date.parse(r.fecha))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const ultima = anteriores[0]
  const obsDesde = relacionados.filter(
    (x) => x.tipo === 'observacion' && (!ultima || x.fecha > ultima.fecha) && x.fecha < r.fecha,
  )
  const pendientes = acuerdos.filter(
    (a) => a.estado !== 'completado' && a.alumnoIds.some((x) => r.alumnoIds.includes(x)),
  )

  return (
    <div className="cita-vista fixed inset-0 z-30 flex flex-col bg-bg">
      <header className="pt-safe border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <button onClick={cerrar} aria-label={t.cancelar} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-bg">
            <X size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{titulo}</div>
            <div className="truncate text-xs text-muted">
              {!interna && `${tipo[r.tipo]} · `}{fechaHora(r.fecha, lang)}
            </div>
          </div>
          <button
            onClick={() => descargarCalendario([r], () => interna ? tipo[r.tipo] : t.eventoPrivado)}
            aria-label={t.añadirCalendar}
            title={t.añadirCalendar}
            className="grid size-11 place-items-center rounded-lg text-muted hover:bg-bg"
          >
            <CalendarPlus size={20} />
          </button>
        </div>
        <ol className="mx-auto flex max-w-3xl gap-1 px-4 pb-2">
          {pasos.map((p, i) => (
            <li key={p} className="flex-1">
              <button onClick={() => setPaso(i)} aria-current={i === paso ? 'step' : undefined} className="paso-cita min-h-11 w-full rounded-xl px-2 text-left">
                <div className={clsx('h-1 rounded-full', i <= paso ? 'bg-accent' : 'bg-line')} />
                <div className={clsx('mt-1 truncate text-[11px]', i === paso ? 'font-semibold text-accent' : 'text-muted')}>
                  {p}
                </div>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="cita-contenido flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
          {paso === 0 && <>
            <div className="flex justify-end"><EstadoCita cita={r} /></div>
            {!protegido && <PuntosCita key={r.id} cita={r} />}
          </>}
          {paso === 0 && <ControlGoogleCalendar cita={r} titulo={interna ? tipo[r.tipo] : t.eventoPrivado} />}
          {paso === 0 && (
            <>
              {!interna && r.titulo && nombres && <p className="text-sm font-semibold">{nombres}</p>}
              {asistentes.length > 0 && <p className="text-sm text-muted">{asistentes.join(' · ')}</p>}
              <h3 className="text-[13px] font-semibold uppercase text-muted">{t.ultimaReunion}</h3>
              <Card>{ultima ? <ul><RegistroItem r={ultima} showAlumnos={false} /></ul> : <Empty>—</Empty>}</Card>
              {!interna && <>
              {import.meta.env.VITE_SINGLEFILE && (
                <Link to={`/informes?${new URLSearchParams({
                  archivo: 'reunion', ...(alumnoCita ? { alumno: `${alumnoCita.nombre} ${alumnoCita.apellidos}` } : {}),
                })}`} className="block rounded-xl bg-accent-soft px-4 py-3 font-semibold text-accent">
                  {t.antecedentesArchivados}
                </Link>
              )}
              {anteriores.length > 1 && (
                <details className="rounded-xl border border-line bg-surface">
                  <summary className="cursor-pointer px-4 py-3 font-semibold">{t.historialReuniones}</summary>
                  <ul>{anteriores.slice(1).map((cita) => <RegistroItem key={cita.id} r={cita} showAlumnos={false} />)}</ul>
                </details>
              )}
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
              </>}
            </>
          )}

          {modelo && <HuelhaOficial key={r.id} cita={r} modelo={modelo} paso={paso} datosIniciales={{
            alumno: alumnoCita ? `${alumnoCita.nombre} ${alumnoCita.apellidos}` : r.alumnosOtrosCursos?.[0]?.nombre ?? '',
            fecha: new Date(r.fecha).toLocaleDateString('es-ES'),
            curso: r.alumnosOtrosCursos?.[0]?.curso ?? '',
            clase: alumnoCita?.grupo ?? '',
            asistentes: asistentes.join(', '),
          }} />}
          {!modelo && paso === 1 && (protegido ? <Card><Empty>{t.protegido}</Empty></Card> : interna ? <NotasInternas cita={r} /> : (
            <textarea
              autoFocus
              aria-label={t.anotar}
              value={r.texto}
              onChange={(e) => setTextoRegistro(r.id, e.target.value)}
              rows={14}
              className="w-full rounded-2xl border border-line bg-surface p-4 text-base outline-none focus:border-accent"
            />
          ))}

          {paso === 2 && !interna && !modelo && (
            <Card className="p-5">
              <p className="mb-3 text-xs uppercase text-muted">{t.acta} · {tipo[r.tipo]}</p>
              <p className="mb-2 font-semibold">{titulo}</p>
              <p className="mb-4 text-sm text-muted">{fechaHora(r.fecha, lang)} · {asistentes.join(', ')}</p>
              <p className="whitespace-pre-wrap text-[15px]">{protegido ? '••••••' : r.texto || '—'}</p>
              <p className="mt-6 text-xs text-muted">{t.proximamente}</p>
            </Card>
          )}

          {interna && paso >= 2 && <>
            <ActaInterna cita={r} titulo={titulo} fecha={fechaHora(r.fecha, lang)} />
            {paso === 3 && (
              <div className="acta-acciones flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => window.print()}
                  className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold">
                  <FileDown size={19} aria-hidden /> {t.crearPdfActa}
                </button>
                <p className="text-sm text-muted">{t.abrirPdfActa}</p>
              </div>
            )}
          </>}

          {!interna && !modelo && paso >= 3 && (
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
            className="flex-1 rounded-xl bg-accent py-3 font-semibold text-on-accent disabled:opacity-40"
          >
            {t.siguiente}
          </button>
        </div>
      </footer>
    </div>
  )
}
