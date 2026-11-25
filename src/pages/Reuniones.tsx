// «Reunions»: todas las reuniones (próximas y pasadas) y alta de una nueva.
import clsx from 'clsx'
import { CalendarPlus, ChevronRight, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Empty, PageHeader, SectionTitle } from '../components/ui'
import { useStore } from '../data/store'
import type { Registro, TipoRegistro } from '../data/types'
import { diasDesdeHoy, fechaCorta, hora } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

const tiposReunion: TipoRegistro[] = ['reunionFamilia', 'reunionProfesionales', 'teEscoti']

export function Reuniones() {
  const { t, lang, tipo } = useI18n()
  const { registros, alumnos } = useStore()
  const [nueva, setNueva] = useState(false)
  const nombre = (id: string) => alumnos.find((a) => a.id === id)?.nombre ?? '?'

  const todas = registros.filter((r) => tiposReunion.includes(r.tipo))
  const proximas = todas
    .filter((r) => r.programada && diasDesdeHoy(r.fecha) >= 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  const pasadas = todas.filter((r) => !proximas.includes(r)).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const fila = (r: Registro) => (
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
        {r.estado === 'sinFirmar' && (
          <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] text-warn">{t.actasSinFirmar}</span>
        )}
        <ChevronRight size={18} className="text-muted" />
      </Link>
    </li>
  )

  return (
    <>
      <PageHeader
        title={t.reuniones}
        right={
          <>
            <button disabled title={t.suscripcionIcs} className="rounded-lg p-2 text-muted opacity-50">
              <CalendarPlus size={20} />
            </button>
            <button
              onClick={() => setNueva(true)}
              className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
            >
              <Plus size={16} /> {t.nuevaReunion}
            </button>
          </>
        }
      />
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle count={proximas.length}>{t.proximas}</SectionTitle>
        <Card>{proximas.length === 0 ? <Empty>{t.nadaPendiente}</Empty> : <ul>{proximas.map(fila)}</ul>}</Card>
        <SectionTitle count={pasadas.length}>{t.pasadas}</SectionTitle>
        <Card>{pasadas.length === 0 ? <Empty>{t.sinRegistros}</Empty> : <ul>{pasadas.map(fila)}</ul>}</Card>
      </div>
      {nueva && <NuevaReunion onClose={() => setNueva(false)} />}
    </>
  )
}

function NuevaReunion({ onClose }: { onClose: () => void }) {
  const { t, tipo: tipoLabel } = useI18n()
  const { alumnos, addRegistro } = useStore()
  const [tipo, setTipo] = useState<TipoRegistro>('reunionFamilia')
  const [sel, setSel] = useState<string[]>([])
  const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const [fecha, setFecha] = useState(manana)
  const [horaVal, setHora] = useState('17:00')
  const unico = tipo === 'reunionFamilia'
  const toggle = (id: string) =>
    setSel((s) => (unico ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const ok = sel.length > 0 && fecha && horaVal

  const crear = () => {
    if (!ok) return
    addRegistro({
      tipo,
      fecha: new Date(`${fecha}T${horaVal}`).toISOString(),
      alumnoIds: sel,
      texto: '',
      etiquetas: [],
      visibilidad: tipo === 'teEscoti' ? 'protegido' : tipo === 'reunionProfesionales' ? 'reservado' : 'normal',
      programada: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label={t.nuevaReunion}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface md:max-w-lg md:rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <button onClick={onClose} className="text-muted" aria-label={t.cancelar}>
            <X size={22} />
          </button>
          <span className="font-semibold">{t.nuevaReunion}</span>
          <button
            onClick={crear}
            disabled={!ok}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            {t.crear}
          </button>
        </div>
        <div className="space-y-5 p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {tiposReunion.map((tp) => (
              <button
                key={tp}
                onClick={() => {
                  setTipo(tp)
                  setSel((s) => (tp === 'reunionFamilia' ? s.slice(0, 1) : s))
                }}
                className={clsx(
                  'min-h-11 rounded-xl border px-3 text-sm',
                  tipo === tp ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line',
                )}
              >
                {tipoLabel[tp]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted">{t.fechaLbl}</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-base"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase text-muted">{t.horaLbl}</span>
              <input
                type="time"
                value={horaVal}
                onChange={(e) => setHora(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-base"
              />
            </label>
          </div>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase text-muted">{t.elegirAlumnos}</legend>
            <div className="flex flex-wrap gap-2">
              {alumnos.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className={clsx(
                    'min-h-10 rounded-full border px-3.5 text-[15px]',
                    sel.includes(a.id) ? 'border-accent bg-accent text-on-accent' : 'border-line',
                  )}
                >
                  {a.nombre}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  )
}
