// Agenda › Apunts: línea del tiempo de lo apuntado, como un diario. Filtro por tipo, buscador y fijados arriba;
// se ve el mes actual y se cargan los anteriores de uno en uno (decisiones 0021 y 0022).
import clsx from 'clsx'
import { ChevronDown, Flag, ListChecks, Search, Star, StickyNote } from 'lucide-react'
import { useState } from 'react'
import { RegistroItem } from '../components/RegistroItem'
import { useStore } from '../data/store'
import type { Aher, Registro, TipoRegistro } from '../data/types'
import { diaLocal, fechaCorta, mesYAnyo } from '../lib/fechas'
import { useI18n } from '../lib/i18n'

type Filtre = 'nota' | 'aher' | 'data' | 'observacion' | 'incidencia' | 'comunicacion' | 'tot'
type Apunt = { clau: string; data?: string; fixat: boolean; text: string } & ({ aher: Aher } | { registre: Registro })
const REGISTRES: TipoRegistro[] = ['observacion', 'incidencia', 'comunicacion']

const aData = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }

export function Apunts({ onEditar }: { onEditar: (a: Aher) => void }) {
  const { t, lang, tipo } = useI18n()
  const { ahers, registros, alumnos, guardarAher, guardarRegistro } = useStore()
  const [filtre, setFiltre] = useState<Filtre>('nota')
  const [cerca, setCerca] = useState('')
  const [mesos, setMesos] = useState(1)
  const q = cerca.trim().toLocaleLowerCase()

  const nomsAlumnes = (r: Registro) => r.alumnoIds.map((id) => alumnos.find((a) => a.id === id)?.nombre).filter(Boolean).join(', ')
  const apunts: Apunt[] = [
    ...ahers.filter((a) => !a.responsable).map((a): Apunt => ({ clau: `a-${a.id}`, data: a.fecha, fixat: Boolean(a.fixat), text: a.texto, aher: a })),
    // Los reservados y protegidos solo se buscan por los nombres: su texto no se expone aquí.
    ...registros.filter((r) => REGISTRES.includes(r.tipo)).map((r): Apunt => ({
      clau: `r-${r.id}`, data: diaLocal(r.fecha), fixat: Boolean(r.fixat), text: `${nomsAlumnes(r)} ${r.visibilidad === 'normal' ? r.texto : ''}`, registre: r,
    })),
  ]
  const passa = (x: Apunt) => {
    const k: Filtre = 'aher' in x ? (x.aher.clase ?? 'aher') : (x.registre.tipo as Filtre)
    if (filtre !== 'tot' && k !== filtre) return false
    return !q || x.text.toLocaleLowerCase().includes(q)
  }
  const visibles = apunts.filter(passa).sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
  const fixats = visibles.filter((x) => x.fixat)

  // Línea del tiempo: por días, con separador de mes. Se cargan meses de uno en uno; buscando se ve todo.
  const avui = diaLocal(new Date())
  const ara = new Date()
  const limit = diaLocal(new Date(ara.getFullYear(), ara.getMonth() - (mesos - 1), 1))
  const ambData = visibles.filter((x) => !x.fixat && x.data)
  const senseData = visibles.filter((x) => !x.fixat && !x.data)
  const mostrats = q ? ambData : ambData.filter((x) => (x.data ?? '') >= limit)
  const mesSeguent = !q && ambData.some((x) => (x.data ?? '') < limit) ? new Date(ara.getFullYear(), ara.getMonth() - mesos, 1) : null
  const dies: { data: string; items: Apunt[] }[] = []
  for (const x of mostrats) {
    const ultim = dies[dies.length - 1]
    if (ultim && ultim.data === x.data) ultim.items.push(x)
    else dies.push({ data: x.data as string, items: [x] })
  }
  const nomDia = (d: string) => (d === avui ? t.hoy : fechaCorta(d, lang))

  const fixar = (x: Apunt) => {
    if ('aher' in x) guardarAher({ ...x.aher, fixat: !x.fixat })
    else guardarRegistro({ ...x.registre, fixat: !x.fixat })
  }
  const filtres: [Filtre, string][] = [
    ['nota', t.notaAgenda], ['aher', t.aherUn], ['data', t.dataCors],
    ['observacion', tipo.observacion], ['incidencia', tipo.incidencia], ['comunicacion', tipo.comunicacion], ['tot', t.filtreTot],
  ]

  const fila = (x: Apunt) => {
    const estrella = (
      <button type="button" onClick={() => fixar(x)} aria-pressed={x.fixat} aria-label={x.fixat ? t.desfixar : t.fixar}
        className={clsx('grid size-10 shrink-0 place-items-center rounded-lg', x.fixat ? 'text-warn' : 'text-muted')}>
        <Star size={18} fill={x.fixat ? 'currentColor' : 'none'} aria-hidden />
      </button>
    )
    if ('registre' in x) {
      return (
        <div key={x.clau} className="relative border-b border-line last:border-0">
          <ul className="pr-10">{<RegistroItem r={x.registre} />}</ul>
          <span className="absolute top-2 right-1">{estrella}</span>
        </div>
      )
    }
    const a = x.aher
    const Icona = a.clase === 'data' ? Flag : a.clase === 'nota' ? StickyNote : ListChecks
    return (
      <div key={x.clau} className="flex items-center border-b border-line last:border-0">
        <button type="button" onClick={() => onEditar(a)} className="flex min-h-12 min-w-0 flex-1 items-start gap-3 px-3 py-2.5 text-left hover:bg-bg">
          <span data-marca={a.clase === 'data' ? 'cors' : a.clase === 'nota' ? 'anotacion' : 'tareas'} className="cal-icono-fila"><Icona size={17} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className={clsx('block whitespace-pre-wrap font-medium', !a.clase && a.completado && 'text-muted line-through')}>{a.texto}</span>
            <span className="block text-xs text-muted">{a.fecha ? fechaCorta(a.fecha, lang) : t.sensaData}{a.hora && ` · ${a.hora}`}</span>
          </span>
        </button>
        {estrella}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 focus-within:border-accent">
        <Search size={17} className="text-muted" aria-hidden />
        <input type="search" value={cerca} onChange={(e) => setCerca(e.target.value)} placeholder={t.cercarApunts} aria-label={t.cercarApunts} className="min-h-11 min-w-0 flex-1 bg-transparent outline-none" />
      </div>
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
        {filtres.map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFiltre(f)} aria-pressed={filtre === f}
            className={clsx('min-h-10 shrink-0 rounded-full border px-3 text-sm', filtre === f ? 'border-ink bg-ink text-white' : 'border-line bg-surface')}>
            {label}
          </button>
        ))}
      </div>

      {fixats.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <p className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold"><Star size={15} className="text-warn" fill="currentColor" aria-hidden />{t.fixats} · {fixats.length}</p>
          <div className="border-t border-line">{fixats.map(fila)}</div>
        </div>
      )}

      <ol className="relative space-y-3 border-l-2 border-line pl-4">
        {dies.map((d, i) => {
          const canviMes = i === 0 || dies[i - 1].data.slice(0, 7) !== d.data.slice(0, 7)
          return (
            <li key={d.data}>
              {canviMes && <p className="-ml-4 mb-2 bg-bg py-1 pl-4 text-xs font-semibold uppercase tracking-wide text-muted capitalize">{mesYAnyo(aData(d.data), lang)}</p>}
              <span aria-hidden className="absolute -left-[7px] mt-1.5 size-3 rounded-full border-2 border-surface bg-accent" />
              <p className="mb-1 text-sm font-semibold capitalize">{nomDia(d.data)}</p>
              <div className="overflow-hidden rounded-2xl border border-line bg-surface">{d.items.map(fila)}</div>
            </li>
          )
        })}
      </ol>

      {mesSeguent && (
        <button type="button" onClick={() => setMesos((m) => m + 1)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold text-accent capitalize">
          {t.carregar} {mesYAnyo(mesSeguent, lang)} <ChevronDown size={16} aria-hidden />
        </button>
      )}

      {senseData.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <p className="px-3 py-2.5 text-sm font-semibold">{t.sensaData} · {senseData.length}</p>
          <div className="border-t border-line">{senseData.map(fila)}</div>
        </div>
      )}

      {!dies.length && !senseData.length && !fixats.length && !mesSeguent && <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">{q ? t.arrenTrobat : t.arrenAnotat}</p>}
    </div>
  )
}
