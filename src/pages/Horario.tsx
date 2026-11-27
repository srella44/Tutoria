// Horario conjunto: en una sola cuadrícula, las sesiones del tutor y las de su clase.
// Una sesión «conjunta» ocupa todo el ancho; si cada uno está en un sitio, a la izquierda va la del
// tutor (Jo) y a la derecha la de la clase (con el especialista).
import clsx from 'clsx'
import { CalendarClock, Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Campo, claseInput, Hoja } from '../components/Hoja'
import { PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { QuienHorario, SesionHorario } from '../data/types'
import { semanaAbreviada } from '../lib/fechas'
import { colorMateria, diaHorario, minutos } from '../lib/horario'
import { useI18n } from '../lib/i18n'
import { leerHorario, type LecturaHorario } from '../lib/importarHorario'

const DIAS = [1, 2, 3, 4, 5]

interface Borrador { dia: number; inicio: string; fin: string }

function FormSesion({ sesion, borrador, onClose }: { sesion?: SesionHorario; borrador?: Borrador; onClose: () => void }) {
  const { t, lang } = useI18n()
  const { horario, curso, guardarSesiones, borrarSesion } = useStore()
  const [materia, setMateria] = useState(sesion?.materia ?? '')
  const [quien, setQuien] = useState<QuienHorario>(sesion?.quien ?? 'conjunta')
  const [dias, setDias] = useState<number[]>([sesion?.dia ?? borrador?.dia ?? 1])
  const [inicio, setInicio] = useState(sesion?.inicio ?? borrador?.inicio ?? '09:00')
  const [fin, setFin] = useState(sesion?.fin ?? borrador?.fin ?? '10:00')
  const [docente, setDocente] = useState(sesion?.docente ?? '')
  const [lugar, setLugar] = useState(sesion?.lugar ?? '')
  const [borrar, setBorrar] = useState(false)
  const materias = [...new Set(horario.map((h) => h.materia))].sort()
  const docentes = [...new Set(horario.map((h) => h.docente).filter(Boolean))] as string[]
  const lugares = [...new Set(horario.map((h) => h.lugar).filter(Boolean))] as string[]
  const nombresDias = semanaAbreviada(lang)
  const valido = materia.trim() !== '' && dias.length > 0 && minutos(fin) > minutos(inicio)

  // Al editar se cambia esa sesión; los días añadidos se crean como copias.
  const toggleDia = (d: number) => setDias((xs) => (xs.includes(d) ? xs.filter((x) => x !== d) : [...xs, d].sort()))
  const quienes: [QuienHorario, string][] = [['conjunta', t.quienConjunta], ['mia', t.quienMia], ['clase', t.quienClase]]

  return (
    <Hoja
      titulo={sesion ? t.editar : t.sesionNueva}
      onClose={onClose}
      puedeGuardar={valido}
      onGuardar={() => {
        const comun = {
          cursoId: sesion?.cursoId ?? curso.id,
          inicio,
          fin,
          materia: materia.trim(),
          quien,
          docente: quien === 'mia' ? undefined : docente.trim() || undefined,
          lugar: lugar.trim() || undefined,
        }
        const [primero, ...resto] = sesion && dias.includes(sesion.dia) ? [sesion.dia, ...dias.filter((d) => d !== sesion.dia)] : dias
        guardarSesiones([
          { ...comun, id: sesion?.id ?? crypto.randomUUID(), dia: primero },
          ...resto.map((dia) => ({ ...comun, id: crypto.randomUUID(), dia })),
        ])
        onClose()
      }}
      pie={sesion && (
        <button
          type="button"
          onClick={() => (borrar ? (borrarSesion(sesion.id), onClose()) : setBorrar(true))}
          className={`min-h-10 rounded-xl border border-danger px-3 text-sm text-danger ${borrar ? 'bg-danger-soft font-semibold' : ''}`}
        >
          {borrar ? t.tocaConfirmar : t.borrar}
        </button>
      )}
    >
      <Campo label={t.materia}>
        <input autoFocus={!sesion} list="materias-horario" value={materia} onChange={(e) => setMateria(e.target.value)} className={claseInput} />
        <datalist id="materias-horario">{materias.map((m) => <option key={m} value={m} />)}</datalist>
      </Campo>
      <div className="grid grid-cols-3 gap-2" role="radiogroup">
        {quienes.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={quien === k}
            onClick={() => setQuien(k)}
            className={clsx(
              'min-h-11 rounded-xl border px-2 text-sm leading-tight',
              quien === k ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <Campo label={t.diasSemana}>
        <div className="grid grid-cols-5 gap-2">
          {DIAS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dias.includes(d)}
              onClick={() => toggleDia(d)}
              className={clsx(
                'min-h-11 rounded-xl border text-sm',
                dias.includes(d) ? 'border-accent bg-accent text-on-accent font-semibold' : 'border-line text-ink',
              )}
            >
              {nombresDias[d - 1]}
            </button>
          ))}
        </div>
      </Campo>
      <div className="grid grid-cols-2 gap-4">
        <Campo label={t.horaInicio}>
          <input type="time" step={300} value={inicio} onChange={(e) => setInicio(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.horaFin}>
          <input type="time" step={300} value={fin} onChange={(e) => setFin(e.target.value)} className={claseInput} />
        </Campo>
      </div>
      {quien !== 'mia' && (
        <Campo label={t.docenteClase}>
          <input list="docentes-horario" value={docente} onChange={(e) => setDocente(e.target.value)} className={claseInput} />
          <datalist id="docentes-horario">{docentes.map((m) => <option key={m} value={m} />)}</datalist>
        </Campo>
      )}
      <Campo label={t.lugar}>
        <input list="lugares-horario" value={lugar} onChange={(e) => setLugar(e.target.value)} className={claseInput} />
        <datalist id="lugares-horario">{lugares.map((m) => <option key={m} value={m} />)}</datalist>
      </Campo>
    </Hoja>
  )
}

function ImportarHorario({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { horario, curso, reemplazarHorario } = useStore()
  const [lectura, setLectura] = useState<LecturaHorario>()
  const [error, setError] = useState('')
  const cuenta = (q: QuienHorario) => lectura?.sesiones.filter((s) => s.quien === q).length ?? 0
  return (
    <Hoja
      titulo={t.importarHorario}
      onClose={onClose}
      puedeGuardar={!!lectura}
      onGuardar={() => {
        if (!lectura) return
        reemplazarHorario(lectura.sesiones.map((s) => ({ ...s, id: crypto.randomUUID(), cursoId: curso.id })))
        onClose()
      }}
    >
      <p className="text-sm text-muted">{t.importarHorarioAyuda}</p>
      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-accent px-4 font-semibold text-accent">
        <Upload size={18} /> {t.elegirArchivo}
        <input type="file" className="sr-only"
          accept=".docx,.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            setError('')
            setLectura(undefined)
            leerHorario(f).then(setLectura, (err) => setError(err instanceof Error && err.message === 'sin-horario' ? t.sinHorarioArchivo : t.errorArchivo))
          }}
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      {lectura && (
        <div className="rounded-xl bg-bg p-3 text-sm">
          <p className="font-semibold">{t.sesionesLeidas}: {lectura.sesiones.length}</p>
          <p className="mt-1 text-muted">{t.quienConjunta}: {cuenta('conjunta')} · {t.quienMia}: {cuenta('mia')} · {t.quienClase}: {cuenta('clase')}</p>
          {horario.length > 0 && <p className="mt-2 font-medium text-warn">{t.sustituyeHorario}</p>}
        </div>
      )}
    </Hoja>
  )
}

function useAhora() {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return ahora
}

interface Franja { inicio: string; fin: string }
interface Casilla { conjunta?: SesionHorario; clase?: SesionHorario; mia?: SesionHorario; otras: SesionHorario[] }

/** Franjas del horario (pares inicio–fin distintos), en orden. */
function franjasDe(horario: SesionHorario[]): Franja[] {
  const vistas = new Map<string, Franja>()
  for (const h of horario) vistas.set(`${h.inicio}-${h.fin}`, { inicio: h.inicio, fin: h.fin })
  return [...vistas.values()].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fin.localeCompare(b.fin))
}

function casilla(horario: SesionHorario[], dia: number, f: Franja): Casilla {
  const aqui = horario.filter((h) => h.dia === dia && h.inicio === f.inicio && h.fin === f.fin)
  const conjunta = aqui.find((h) => h.quien === 'conjunta')
  const clase = aqui.find((h) => h.quien === 'clase')
  const mia = aqui.find((h) => h.quien === 'mia')
  return { conjunta, clase, mia, otras: aqui.filter((h) => h !== conjunta && h !== clase && h !== mia) }
}

/** La misma materia conjunta los cinco días (p. ej. el patio): se pinta como una banda. */
function banda(horario: SesionHorario[], f: Franja) {
  const cs = DIAS.map((d) => casilla(horario, d, f))
  const m = cs[0].conjunta?.materia
  return m && cs.every((c) => c.conjunta?.materia === m && !c.clase && !c.mia && !c.otras.length) ? cs.map((c) => c.conjunta!) : null
}

/** Lo mío cuando no estoy con la clase: una pastilla de color. */
function Pastilla({ s, onClick, grande }: { s: SesionHorario; onClick: () => void; grande?: boolean }) {
  const { t } = useI18n()
  return (
    <button
      type="button"
      data-color={colorMateria(s.materia)}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={clsx('flex max-w-full items-center gap-1.5 rounded-lg px-2 text-left font-semibold', grande ? 'min-h-9 text-sm' : 'min-h-7 text-xs')}
      style={{ background: 'var(--seccion-fondo)', color: 'var(--seccion-tinta)' }}
    >
      <span className="shrink-0 font-normal opacity-75">{t.yo}:</span>
      <span className="truncate">{s.materia}</span>
    </button>
  )
}

/** Contenido de una casilla: arriba la clase (o la sesión conjunta), debajo lo mío si estoy en otro sitio. */
function ContenidoCasilla({ c, onSesion, grande }: { c: Casilla; onSesion: (s: SesionHorario) => void; grande?: boolean }) {
  const deClase = c.conjunta ?? c.clase
  return (
    <>
      {deClase && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSesion(deClase) }}
          className="block w-full text-left"
        >
          <span className={clsx('block font-bold leading-tight', grande ? 'text-lg' : 'text-[15px]')}>{deClase.materia}</span>
          {(deClase.docente || deClase.lugar) && (
            <span className={clsx('block truncate text-muted', grande ? 'text-sm' : 'text-xs')}>{[deClase.docente, deClase.lugar].filter(Boolean).join(' · ')}</span>
          )}
        </button>
      )}
      {(c.mia || c.otras.length > 0) && (
        <div className={clsx('flex flex-wrap gap-1', deClase && 'mt-1.5')}>
          {[c.mia, ...c.otras].filter((x): x is SesionHorario => !!x).map((s) => <Pastilla key={s.id} s={s} grande={grande} onClick={() => onSesion(s)} />)}
        </div>
      )}
    </>
  )
}

const enFranja = (f: Franja, m: number) => minutos(f.inicio) <= m && m < minutos(f.fin)

export function Horario() {
  const { t, lang } = useI18n()
  const { horario } = useStore()
  const ahora = useAhora()
  const hoy = diaHorario(ahora)
  const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes()
  const [dia, setDia] = useState(hoy || 1)
  const [editando, setEditando] = useState<SesionHorario | Borrador>()
  const [importando, setImportando] = useState(false)
  const nombresDias = semanaAbreviada(lang)

  const franjas = useMemo(() => franjasDe(horario), [horario])
  const nueva = (d: number, inicio = '09:00', fin = '10:00'): Borrador => ({ dia: d, inicio, fin })
  const onSesion = (s: SesionHorario) => setEditando(s)
  // Hueco grande entre franjas (el mediodía): se deja un respiro visual.
  const separada = (i: number) => i > 0 && minutos(franjas[i].inicio) - minutos(franjas[i - 1].fin) >= 30

  return (
    <>
      <PageHeader
        title={t.horario}
        icon={CalendarClock}
        color="azul"
        amplio
        right={
          <>
          <button
            onClick={() => setImportando(true)}
            aria-label={t.importarHorario}
            title={t.importarHorario}
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent hover:bg-accent-soft"
          >
            <Upload size={18} />
          </button>
          <button
            onClick={() => setEditando(nueva(dia))}
            aria-label={t.sesionNueva}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t.sesionNueva}</span>
          </button>
          </>
        }
      />
      <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-6">
        {horario.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-5 text-center">
            <p className="text-sm text-muted">{t.sinHorario}</p>
            <button
              onClick={() => setEditando(nueva(dia))}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-on-accent"
            >
              <Plus size={18} /> {t.sesionNueva}
            </button>
            <button
              onClick={() => setImportando(true)}
              className="mt-2 ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent px-4 font-semibold text-accent"
            >
              <Upload size={18} /> {t.importarHorario}
            </button>
          </div>
        ) : (
          <p className="mb-3 text-xs text-muted">{t.horarioAyuda}</p>
        )}

        {horario.length > 0 && (
          <>
            {/* iPhone: un día cada vez, como una lista */}
            <div className="md:hidden">
              <div className="mb-3 grid grid-cols-5 gap-1.5" role="tablist">
                {DIAS.map((d) => (
                  <button
                    key={d}
                    role="tab"
                    aria-selected={dia === d}
                    onClick={() => setDia(d)}
                    className={clsx(
                      'min-h-11 rounded-xl text-sm',
                      dia === d ? 'bg-accent font-semibold text-on-accent' : 'border border-line bg-surface',
                      d === hoy && dia !== d && 'font-semibold text-accent',
                    )}
                  >
                    {nombresDias[d - 1]}
                  </button>
                ))}
              </div>
              <ol className="space-y-2">
                {franjas.map((f, i) => {
                  const c = casilla(horario, dia, f)
                  const vacia = !c.conjunta && !c.clase && !c.mia && !c.otras.length
                  const corta = !!banda(horario, f)
                  const actual = dia === hoy && enFranja(f, ahoraMin)
                  return (
                    <li key={`${f.inicio}-${f.fin}`} className={clsx(separada(i) && 'pt-3')}>
                      <div
                        onClick={() => setEditando(nueva(dia, f.inicio, f.fin))}
                        className={clsx(
                          'flex gap-3 rounded-2xl border bg-surface px-3',
                          corta ? 'py-1.5' : 'py-3',
                          actual ? 'border-accent ring-2 ring-accent/30' : 'border-line',
                        )}
                      >
                        <div className={clsx('w-12 shrink-0 tabular-nums', corta ? 'text-xs text-muted' : 'text-sm')}>
                          <span className="block font-semibold">{f.inicio}</span>
                          {!corta && <span className="block text-muted">{f.fin}</span>}
                        </div>
                        <div className={clsx('min-w-0 flex-1', corta && 'text-muted')}>
                          {actual && <span className="mb-1 inline-block rounded-full bg-accent px-2 text-[11px] font-semibold text-on-accent">{t.ahora}</span>}
                          {vacia ? <span className="text-sm text-muted">—</span> : corta
                            ? <span className="text-sm font-medium">{c.conjunta?.materia}</span>
                            : <ContenidoCasilla c={c} onSesion={onSesion} grande />}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* iPad y ordenador: la semana entera, como el horario en papel */}
            <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-surface">
                  <tr>
                    <th className="w-20 border-b border-line" />
                    {DIAS.map((d) => (
                      <th key={d} className={clsx('border-b border-l border-line py-2.5 text-sm', d === hoy ? 'bg-accent-soft font-bold text-accent' : 'font-semibold')}>
                        {nombresDias[d - 1]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {franjas.map((f, i) => {
                    const b = banda(horario, f)
                    return (
                      <tr key={`${f.inicio}-${f.fin}`} className={clsx(separada(i) && 'border-t-[6px] border-bg')}>
                        <th className={clsx('border-b border-line px-2 text-right align-top font-normal tabular-nums', b ? 'py-1 text-xs text-muted' : 'py-2 text-sm')}>
                          <span className="block font-semibold">{f.inicio}</span>
                          {!b && <span className="block text-muted">{f.fin}</span>}
                        </th>
                        {b ? (
                          <td colSpan={5} className="border-b border-l border-line bg-bg/60 py-1 text-center text-sm font-semibold tracking-wide text-muted">
                            <button type="button" onClick={() => onSesion(b[0])} className="w-full">{b[0].materia}</button>
                          </td>
                        ) : DIAS.map((d) => {
                          const c = casilla(horario, d, f)
                          const actual = d === hoy && enFranja(f, ahoraMin)
                          return (
                            <td
                              key={d}
                              onClick={() => setEditando(nueva(d, f.inicio, f.fin))}
                              className={clsx(
                                'cursor-pointer border-b border-l border-line p-2 align-top hover:bg-bg/60',
                                d === hoy && 'bg-accent-soft/40',
                                actual && 'outline-2 -outline-offset-2 outline-accent',
                              )}
                            >
                              <ContenidoCasilla c={c} onSesion={onSesion} />
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {importando && <ImportarHorario onClose={() => setImportando(false)} />}
      {editando && (
        <FormSesion
          key={'id' in editando ? editando.id : 'nueva'}
          sesion={'id' in editando ? editando : undefined}
          borrador={'id' in editando ? undefined : editando}
          onClose={() => setEditando(undefined)}
        />
      )}
    </>
  )
}
