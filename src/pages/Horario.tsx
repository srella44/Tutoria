// Horario conjunto: en una sola cuadrícula, las sesiones del tutor y las de su clase.
// Una sesión «conjunta» ocupa todo el ancho; si cada uno está en un sitio, a la izquierda va la del
// tutor (Jo) y a la derecha la de la clase (con el especialista).
import clsx from 'clsx'
import { CalendarClock, Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Campo, claseInput, Hoja } from '../components/Hoja'
import { PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { QuienHorario, SesionHorario } from '../data/types'
import { semanaAbreviada } from '../lib/fechas'
import { colorMateria, diaHorario, minutos, sesionesDelDia } from '../lib/horario'
import { useI18n } from '../lib/i18n'
import { leerHorario, type LecturaHorario } from '../lib/importarHorario'

const DIAS = [1, 2, 3, 4, 5]
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

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

/** Una columna de día, a escala: cada minuto ocupa `escala` píxeles. */
function ColumnaDia({ sesiones, desde, hasta, escala, ahoraMin, onSesion, onVacio }: {
  sesiones: SesionHorario[]
  desde: number
  hasta: number
  escala: number
  ahoraMin?: number
  onSesion: (s: SesionHorario) => void
  onVacio: (minuto: number) => void
}) {
  const { t } = useI18n()
  const clicVacio = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    onVacio(desde + Math.floor(y / escala / 15) * 15)
  }
  return (
    <div className="relative border-l border-line" style={{ height: (hasta - desde) * escala }} onClick={clicVacio}>
      {Array.from({ length: Math.floor((hasta - desde) / 60) + 1 }, (_, i) => (
        <div key={i} className="pointer-events-none absolute inset-x-0 border-t border-line/70" style={{ top: i * 60 * escala }} />
      ))}
      {sesiones.map((s) => {
        const top = (minutos(s.inicio) - desde) * escala
        const alto = (minutos(s.fin) - minutos(s.inicio)) * escala
        const lado = s.quien === 'conjunta' ? 'inset-x-1' : s.quien === 'mia' ? 'left-1 right-[calc(50%+1px)]' : 'left-[calc(50%+1px)] right-1'
        return (
          <button
            key={s.id}
            type="button"
            data-color={colorMateria(s.materia)}
            onClick={() => onSesion(s)}
            className={clsx(
              'absolute overflow-hidden rounded-lg border-l-4 px-1.5 py-0.5 text-left text-xs leading-tight hover:brightness-95',
              lado,
              s.quien === 'mia' && 'border-dashed outline outline-1 -outline-offset-1 outline-[var(--seccion-intenso)]/40',
            )}
            style={{ top: top + 1, height: alto - 2, background: 'var(--seccion-fondo)', color: 'var(--seccion-tinta)', borderLeftColor: 'var(--seccion-intenso)' }}
            title={`${s.inicio}–${s.fin} · ${s.materia}${s.docente ? ` · ${s.docente}` : ''}${s.lugar ? ` · ${s.lugar}` : ''}`}
          >
            {s.quien !== 'conjunta' && alto >= 56 && (
              <span className="block truncate text-[10px] font-semibold uppercase tracking-wide opacity-70">{s.quien === 'mia' ? t.yo : t.laClase}</span>
            )}
            <span className="block truncate font-semibold">{s.materia}</span>
            {alto >= 40 && <span className="block truncate tabular-nums opacity-80">{s.quien === 'conjunta' ? `${s.inicio}–${s.fin}` : s.inicio}</span>}
            {alto >= 56 && (s.docente || s.lugar) && (
              <span className="block truncate opacity-80">{[s.docente, s.lugar].filter(Boolean).join(' · ')}</span>
            )}
          </button>
        )
      })}
      {ahoraMin !== undefined && ahoraMin >= desde && ahoraMin <= hasta && (
        <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-danger" style={{ top: (ahoraMin - desde) * escala }}>
          <span className="absolute -top-1 -left-1 h-2.5 w-2.5 rounded-full bg-danger" />
        </div>
      )}
    </div>
  )
}

function Regla({ desde, hasta, escala }: { desde: number; hasta: number; escala: number }) {
  return (
    <div className="relative w-11 shrink-0" style={{ height: (hasta - desde) * escala }}>
      {Array.from({ length: Math.floor((hasta - desde) / 60) + 1 }, (_, i) => (
        <span key={i} className="absolute right-1.5 -translate-y-1/2 text-[11px] tabular-nums text-muted" style={{ top: i * 60 * escala }}>
          {hhmm(desde + i * 60)}
        </span>
      ))}
    </div>
  )
}

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

  // Rango visible: de la primera hora en punto a la última, con un mínimo de 9 a 17.
  const [desde, hasta] = useMemo(() => {
    if (!horario.length) return [9 * 60, 17 * 60]
    const ini = Math.min(...horario.map((h) => minutos(h.inicio)))
    const fin = Math.max(...horario.map((h) => minutos(h.fin)))
    return [Math.floor(ini / 60) * 60, Math.ceil(fin / 60) * 60]
  }, [horario])

  const nueva = (d: number, minuto = 9 * 60): Borrador => ({ dia: d, inicio: hhmm(minuto), fin: hhmm(Math.min(minuto + 60, 23 * 60 + 55)) })
  const props = (d: number, escala: number) => ({
    sesiones: sesionesDelDia(horario, d),
    desde,
    hasta,
    escala,
    ahoraMin: d === hoy ? ahoraMin : undefined,
    onSesion: (s: SesionHorario) => setEditando(s),
    onVacio: (m: number) => setEditando(nueva(d, m)),
  })

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
            {/* iPhone: un día cada vez */}
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
              <div className="flex rounded-2xl border border-line bg-surface py-3 pr-1">
                <Regla desde={desde} hasta={hasta} escala={1.6} />
                <div className="flex-1"><ColumnaDia {...props(dia, 1.6)} /></div>
              </div>
            </div>

            {/* iPad y ordenador: la semana entera */}
            <div className="hidden rounded-2xl border border-line bg-surface pb-3 pr-1 md:block">
              <div className="sticky top-16 z-10 ml-11 grid grid-cols-5 rounded-t-2xl bg-surface">
                {DIAS.map((d) => (
                  <div key={d} className={clsx('border-l border-line py-2 text-center text-sm', d === hoy ? 'font-bold text-accent' : 'font-semibold')}>
                    {nombresDias[d - 1]}
                  </div>
                ))}
              </div>
              <div className="flex pt-2">
                <Regla desde={desde} hasta={hasta} escala={1.4} />
                <div className="grid flex-1 grid-cols-5">
                  {DIAS.map((d) => <ColumnaDia key={d} {...props(d, 1.4)} />)}
                </div>
              </div>
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
