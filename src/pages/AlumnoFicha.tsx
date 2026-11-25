import clsx from 'clsx'
import { ChevronLeft, Mail, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QuickCapture } from '../components/QuickCapture'
import { RegistroItem } from '../components/RegistroItem'
import { Avatar, Card, Empty } from '../components/ui'
import { useStore } from '../data/store'
import type { TipoRegistro } from '../data/types'
import { fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

type Tab = 'cronologia' | 'datos' | 'contactos' | 'documentos' | 'evaluacion'

export function AlumnoFicha() {
  const { id } = useParams()
  const { t, lang, tipo } = useI18n()
  const { alumnos, registros, contactos, acuerdos } = useStore()
  const [tab, setTab] = useState<Tab>('cronologia')
  const [filtro, setFiltro] = useState<TipoRegistro | 'todos'>('todos')
  const [capture, setCapture] = useState(false)
  const a = alumnos.find((x) => x.id === id)
  if (!a) return <Empty>404</Empty>

  const propios = registros
    .filter((r) => r.alumnoIds.includes(a.id) && !r.programada)
    .sort((x, y) => y.fecha.localeCompare(x.fecha))
  const visibles = filtro === 'todos' ? propios : propios.filter((r) => r.tipo === filtro)
  const tiposPresentes = [...new Set(propios.map((r) => r.tipo))]
  const familia = contactos.filter((c) => c.alumnoIds.includes(a.id))
  const preferente = familia.find((c) => c.preferente)
  const susAcuerdos = acuerdos.filter((x) => x.alumnoIds.includes(a.id))

  const tabs: [Tab, string][] = [
    ['cronologia', t.cronologia],
    ['datos', t.datos],
    ['contactos', t.contactos],
    ['documentos', t.documentos],
    ['evaluacion', t.evaluacion],
  ]

  return (
    <>
      <header className="pt-safe border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <Link to="/alumnado" className="flex h-12 items-center gap-1 text-accent md:hidden">
            <ChevronLeft size={20} /> {t.alumnado}
          </Link>
          <div className="flex items-center gap-4 md:pt-5">
            <Avatar nombre={a.nombre} apellidos={a.apellidos} size={64} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-tight">{a.nombre}</h1>
              <p className="text-muted">
                {a.apellidos} · {a.grupo}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {preferente && (
              <>
                <a href={`tel:${preferente.telefonos[0]}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-soft py-2 text-sm font-medium text-accent">
                  <Phone size={16} /> {t.llamar}
                </a>
                <a href={`mailto:${preferente.correos[0] ?? ''}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-soft py-2 text-sm font-medium text-accent">
                  <Mail size={16} /> {t.escribir}
                </a>
              </>
            )}
            <button onClick={() => setCapture(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2 text-sm font-medium text-on-accent">
              <Plus size={16} /> {t.capturar}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2">
          {tabs.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={clsx(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm',
                tab === k ? 'border-accent font-semibold text-accent' : 'border-transparent text-muted',
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4">
        {tab === 'cronologia' && (
          <>
            <div className="mb-3 flex gap-2 overflow-x-auto">
              {(['todos', ...tiposPresentes] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFiltro(k)}
                  className={clsx(
                    'shrink-0 rounded-full border px-3 py-1 text-sm',
                    filtro === k ? 'border-accent bg-accent text-on-accent' : 'border-line',
                  )}
                >
                  {k === 'todos' ? t.todos : tipo[k]}
                </button>
              ))}
            </div>
            <Card>
              {visibles.length === 0 ? (
                <Empty>{t.sinRegistros}</Empty>
              ) : (
                <ul>
                  {visibles.map((r) => (
                    <RegistroItem key={r.id} r={r} showAlumnos={r.alumnoIds.length > 1} />
                  ))}
                </ul>
              )}
            </Card>
            {susAcuerdos.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 px-1 text-[13px] font-semibold uppercase text-muted">{t.acuerdos}</h3>
                <Card>
                  <ul>
                    {susAcuerdos.map((x) => (
                      <li key={x.id} className="border-b border-line px-4 py-3 last:border-0">
                        <div>{x.texto}</div>
                        <div className="text-xs text-muted">
                          {x.responsable} · {t.revision} {fechaCorta(x.fechaRevision, lang)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </>
        )}

        {tab === 'datos' && (
          <Card>
            <dl className="divide-y divide-line">
              <Row k={t.nacimiento} v={a.fechaNacimiento.split('-').reverse().join('/')} />
              <Row k={t.grupo} v={a.grupo} />
              <Row k={t.info} v={a.infoRelevante ?? '—'} />
            </dl>
          </Card>
        )}

        {tab === 'contactos' && (
          <div className="space-y-3">
            {familia.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{c.nombre}</div>
                  {c.preferente && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">{t.preferente}</span>
                  )}
                </div>
                <div className="text-sm text-muted">
                  {c.relacion} · {t.lengua}: {c.lengua}
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {c.telefonos.map((tel) => (
                    <a key={tel} href={`tel:${tel}`} className="block text-accent">
                      {tel}
                    </a>
                  ))}
                  {c.correos.map((m) => (
                    <a key={m} href={`mailto:${m}`} className="block text-accent">
                      {m}
                    </a>
                  ))}
                </div>
                {c.restricciones && (
                  <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
                    {t.restricciones}: {c.restricciones}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        {(tab === 'documentos' || tab === 'evaluacion') && (
          <Card>
            {tab === 'evaluacion' && propios.some((r) => r.tipo === 'evaluacion') ? (
              <ul>
                {propios
                  .filter((r) => r.tipo === 'evaluacion')
                  .map((r) => (
                    <RegistroItem key={r.id} r={r} showAlumnos={false} />
                  ))}
              </ul>
            ) : (
              <Empty>{t.proximamente}</Empty>
            )}
          </Card>
        )}
      </div>

      {capture && <QuickCapture preset={[a.id]} onClose={() => setCapture(false)} />}
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-36 shrink-0 text-sm text-muted">{k}</dt>
      <dd className="text-[15px]">{v}</dd>
    </div>
  )
}
