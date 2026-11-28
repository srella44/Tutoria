// Agenda › Apunts: lo que se ha ido apuntando, sin listas infinitas. Filtro por tipo, buscador, fijados arriba,
// grupos por semana (las dos últimas abiertas) y tres por grupo con «Veir mès» (decisión 0021).
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
const PER_GRUP = 3

const aData = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const dillunsDe = (s: string) => { const d = aData(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return diaLocal(d) }

export function Apunts({ onEditar }: { onEditar: (a: Aher) => void }) {
  const { t, lang, tipo } = useI18n()
  const { ahers, registros, alumnos, guardarAher, guardarRegistro } = useStore()
  const [filtre, setFiltre] = useState<Filtre>('nota')
  const [cerca, setCerca] = useState('')
  const [oberts, setOberts] = useState<Record<string, boolean>>({})
  const [complets, setComplets] = useState<Record<string, boolean>>({})
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

  // Grupos: semana actual, la pasada, semanas del último mes; lo anterior, por meses; sin fecha al final.
  const avui = diaLocal(new Date())
  const aquesta = dillunsDe(avui)
  const grups: { clau: string; titol: string; items: Apunt[] }[] = []
  for (const x of visibles.filter((y) => !y.fixat)) {
    let clau: string, titol: string
    if (!x.data) { clau = 'sense'; titol = t.sensaData }
    else {
      const dl = dillunsDe(x.data)
      const setmanes = Math.round((aData(aquesta).getTime() - aData(dl).getTime()) / 6048e5)
      if (setmanes <= 0) { clau = 's0'; titol = t.aguestaSetmana }
      else if (setmanes === 1) { clau = 's1'; titol = t.setmanaPassada }
      else if (setmanes < 5) { clau = `s${setmanes}`; titol = `${t.setmanaDeth} ${fechaCorta(dl, lang)}` }
      else { clau = x.data.slice(0, 7); titol = mesYAnyo(aData(`${clau}-01`), lang) }
    }
    const g = grups.find((y) => y.clau === clau) ?? (grups.push({ clau, titol, items: [] }), grups[grups.length - 1])
    g.items.push(x)
  }
  const obert = (clau: string, i: number) => Boolean(q) || (oberts[clau] ?? i < 2)

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

      {grups.map((g, i) => {
        const ob = obert(g.clau, i)
        const llista = complets[g.clau] || q ? g.items : g.items.slice(0, PER_GRUP)
        return (
          <div key={g.clau} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <button type="button" onClick={() => setOberts((o) => ({ ...o, [g.clau]: !ob }))} aria-expanded={ob}
              className="flex min-h-12 w-full items-center gap-2 px-3 text-left text-sm font-semibold capitalize">
              <span className="flex-1">{g.titol}</span>
              <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">{g.items.length}</span>
              <ChevronDown size={16} className={clsx('text-muted transition-transform', ob && 'rotate-180')} aria-hidden />
            </button>
            {ob && (
              <div className="border-t border-line">
                {llista.map(fila)}
                {llista.length < g.items.length && (
                  <button type="button" onClick={() => setComplets((c) => ({ ...c, [g.clau]: true }))} className="min-h-11 w-full border-t border-line text-sm font-semibold text-accent">
                    {t.veirMes} ({g.items.length - llista.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {!grups.length && !fixats.length && <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">{q ? t.arrenTrobat : t.arrenAnotat}</p>}
    </div>
  )
}
