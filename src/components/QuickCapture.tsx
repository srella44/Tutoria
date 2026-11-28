// Registre nau: todo lo que se apunta entra por aquí. Primero el tipo (alumnado o agenda) y el formulario se adapta.
// Objetivo: 5 segundos. Recuerda el último tipo; desde la ficha entra en Observacion con el alumno marcado
// y desde la Agenda trae el día que se está mirando (decisión 0021).
import clsx from 'clsx'
import { AlertTriangle, ChevronDown, ChevronLeft, Eye, Flag, ListChecks, MessageSquare, Search, StickyNote, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import type { TipoRegistro } from '../data/types'
import { diaLocal } from '../lib/fechas'
import { useI18n } from '../lib/i18n'
import { BotoTreureHora } from './Hoja'

type TipusCaptura = 'observacion' | 'incidencia' | 'comunicacion' | 'nota' | 'aher' | 'data'
const ALUMNAT: TipusCaptura[] = ['observacion', 'incidencia', 'comunicacion']
const AGENDA: TipusCaptura[] = ['nota', 'aher', 'data']
const ICONES = { observacion: Eye, incidencia: AlertTriangle, comunicacion: MessageSquare, nota: StickyNote, aher: ListChecks, data: Flag }
// Preferencia de uso, sin datos personales.
const CLAU_DARRER = 'tutoria-darrer-tipus'

const llegirDarrer = (): TipusCaptura | null => {
  try {
    const v = localStorage.getItem(CLAU_DARRER)
    return v && [...ALUMNAT, ...AGENDA].includes(v as TipusCaptura) ? (v as TipusCaptura) : null
  } catch { return null }
}
const ara = () => { const d = new Date(); return { dia: diaLocal(d), hora: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` } }

export function QuickCapture({ onClose, preset, dia }: { onClose: () => void; preset?: string[]; dia?: string }) {
  const { t, tipo: tipoLabel } = useI18n()
  const { alumnosActivos: alumnos, frases, addRegistro, addAher } = useStore()
  const [tipus, setTipus] = useState<TipusCaptura | null>(() => (preset?.length ? 'observacion' : dia ? null : llegirDarrer()))
  const [sel, setSel] = useState<string[]>(preset ?? [])
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [moment] = useState(ara)
  const [data, setData] = useState(dia ?? moment.dia)
  const [hora, setHora] = useState(dia ? '' : moment.hora)
  const esAlumnat = tipus !== null && ALUMNAT.includes(tipus)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const etiqueta = (k: TipusCaptura) => (k === 'nota' ? t.notaAgenda : k === 'aher' ? t.aherUn : k === 'data' ? t.dataCors : tipoLabel[k as TipoRegistro])
  const triar = (k: TipusCaptura) => {
    setTipus(k)
    try { localStorage.setItem(CLAU_DARRER, k) } catch { /* sin almacenamiento */ }
    // Para alumnado, «ara» por defecto; para la agenda, el día (y la hora solo si se pone).
    if (ALUMNAT.includes(k)) { if (!hora) setHora(dia ? '' : moment.hora) } else if (!dia) setHora('')
  }

  const consulta = busqueda.trim().toLocaleLowerCase()
  const ordenats = [...alumnos].sort((a, b) => (a.numeroLista ?? 999) - (b.numeroLista ?? 999) || a.nombre.localeCompare(b.nombre))
  const visibles = ordenats.filter((a) => !consulta || `${a.nombre} ${a.apellidos}`.toLocaleLowerCase().includes(consulta) || String(a.numeroLista ?? '') === consulta)
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const puedeGuardar = tipus !== null && texto.trim().length > 0 && (esAlumnat ? sel.length > 0 && data !== '' : tipus === 'aher' || data !== '')

  const guardar = () => {
    if (!puedeGuardar || !tipus) return
    if (esAlumnat) {
      const fecha = new Date(`${data}T${hora || '12:00'}`).toISOString()
      addRegistro({
        tipo: tipus as TipoRegistro,
        fecha,
        alumnoIds: sel,
        texto: texto.trim(),
        etiquetas: [],
        visibilidad: 'normal',
        estado: tipus === 'incidencia' ? 'abierto' : undefined,
      })
    } else {
      addAher(texto.trim(), data || undefined, { ...(data && hora ? { hora } : {}), ...(tipus === 'aher' ? {} : { clase: tipus as 'nota' | 'data' }) })
    }
    onClose()
  }

  const nom = (id: string) => alumnos.find((a) => a.id === id)

  return (
    <div className="pt-safe fixed inset-0 z-40 flex flex-col bg-surface">
      <div role="dialog" aria-modal="true" aria-label={t.nuevoRegistro} className="pb-safe min-h-0 w-full flex-1 overflow-y-auto overscroll-contain bg-surface">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface px-3 py-3">
          {tipus === null || preset?.length ? (
            <button onClick={onClose} className="grid size-11 place-items-center rounded-full text-muted hover:bg-bg" aria-label={t.cancelar}><X size={22} /></button>
          ) : (
            <button onClick={() => setTipus(null)} className="grid size-11 place-items-center rounded-full text-muted hover:bg-bg" aria-label={t.cambiarTipo}><ChevronLeft size={24} /></button>
          )}
          <span className="min-w-0 truncate font-semibold">{tipus ? etiqueta(tipus) : t.nuevoRegistro}</span>
          {tipus ? (
            <button onClick={guardar} disabled={!puedeGuardar} className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40">{t.guardar}</button>
          ) : <span className="w-11" />}
        </div>

        {tipus === null ? (
          <div className="space-y-5 p-4">
            {([[t.alumnado, ALUMNAT, 'text-accent'], [t.agenda, AGENDA, 'text-warn']] as const).map(([titol, llista, color]) => (
              <section key={titol}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{titol}</h2>
                <div className="grid grid-cols-3 gap-2">
                  {llista.map((k) => {
                    const Icona = ICONES[k]
                    return (
                      <button key={k} onClick={() => triar(k)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-1 text-sm font-semibold hover:bg-bg">
                        <Icona size={26} className={color} aria-hidden />{etiqueta(k)}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-5 p-4">
            {/* Cambio rápido de tipo sin volver atrás. */}
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {[...ALUMNAT, ...AGENDA].map((k) => (
                <button key={k} onClick={() => triar(k)} aria-pressed={tipus === k}
                  className={clsx('min-h-10 shrink-0 rounded-full border px-3 text-sm', tipus === k ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-muted')}>
                  {etiqueta(k)}
                </button>
              ))}
            </div>

            {esAlumnat && (
              <fieldset>
                <legend className="mb-2 text-xs font-semibold uppercase text-muted">{t.elegirAlumnos}{sel.length > 0 && ` · ${sel.length}`}</legend>
                {sel.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {sel.map((id) => (
                      <button key={id} onClick={() => toggle(id)} className="flex min-h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-sm text-on-accent" aria-label={`${t.quitar} ${nom(id)?.nombre ?? ''}`}>
                        {nom(id)?.nombre}<X size={14} aria-hidden />
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 focus-within:border-accent">
                  <Search size={17} className="text-muted" aria-hidden />
                  <input type="search" aria-label={t.buscarAlumnos} placeholder={t.cercarNomONumero} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="min-h-11 min-w-0 flex-1 bg-transparent outline-none" />
                </div>
                <ul className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line">
                  {visibles.map((a) => {
                    const on = sel.includes(a.id)
                    return (
                      <li key={a.id} className="border-b border-line last:border-0">
                        <button onClick={() => toggle(a.id)} aria-pressed={on} className={clsx('flex min-h-11 w-full items-center gap-3 px-3 text-left text-[15px]', on && 'bg-accent-soft')}>
                          <span className="w-6 text-right text-sm text-muted tabular-nums">{a.numeroLista ?? ''}</span>
                          <span className="min-w-0 flex-1 truncate">{a.nombre} <span className="text-muted">{a.apellidos}</span></span>
                          <span className={clsx('grid size-6 place-items-center rounded-md border text-sm', on ? 'border-accent bg-accent text-on-accent' : 'border-line')}>{on ? '✓' : ''}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </fieldset>
            )}

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase text-muted">{t.texto}</span>
              <textarea autoFocus={!esAlumnat} value={texto} onChange={(e) => setTexto(e.target.value)} rows={3}
                className="w-full rounded-2xl border border-line bg-bg p-3 text-base focus:border-accent focus:outline-2 focus:outline-accent" />
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase text-muted">{esAlumnat ? t.quan : tipus === 'aher' ? t.fechaTarea : t.dataAgenda}</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} aria-label={t.dataAgenda} className="h-11 w-full min-w-0 rounded-xl border border-line bg-bg px-3 text-base" />
                <div className="flex min-w-0 gap-1">
                  <input type="time" value={hora} disabled={!data} onChange={(e) => setHora(e.target.value)} aria-label={t.horaOpcional} className="h-11 w-full min-w-0 rounded-xl border border-line bg-bg px-3 text-base disabled:opacity-40" />
                  {hora && <BotoTreureHora onTreure={() => setHora('')} />}
                </div>
              </div>
              {tipus === 'aher' && data && <button type="button" onClick={() => { setData(''); setHora('') }} className="mt-2 text-sm font-semibold text-accent">{t.sensaData}</button>}
            </div>

            {esAlumnat && frases.length > 0 && (
              <details className="rounded-xl border border-line px-3">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">{t.frases} <ChevronDown size={17} aria-hidden /></summary>
                <div className="flex flex-wrap gap-2 pb-3">
                  {frases.map((f) => (
                    <button key={f.id} onClick={() => setTexto((x) => (x ? `${x} ${f.texto}` : f.texto))} className="min-h-11 rounded-lg bg-bg px-3 py-2 text-left text-sm hover:bg-accent-soft">{f.texto}</button>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
