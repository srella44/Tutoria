// Importar alumnado: elegir fichero, revisar la vista previa (separar nombre y apellidos) e importar.
import clsx from 'clsx'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, FileSpreadsheet, ImageIcon, ShieldAlert, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { claseInput } from '../components/Hoja'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { Alumno, ContactoFamiliar } from '../data/types'
import { fechaCorta } from '../lib/fechas'
import { useI18n } from '../lib/i18n'
import { claveNombre, leerArchivo, type FilaImportada, type ResultadoImportacion } from '../lib/importar'

export function Importar() {
  const { t, lang } = useI18n()
  const { curso, alumnos, importarAlumnado } = useStore()
  const navigate = useNavigate()
  const [resultado, setResultado] = useState<ResultadoImportacion>()
  const [filas, setFilas] = useState<FilaImportada[]>([])
  const [excluidas, setExcluidas] = useState<Set<number>>(new Set())
  const [grupo, setGrupo] = useState('')
  const [conContactos, setConContactos] = useState(true)
  const [error, setError] = useState<string>()

  const existentes = new Set(alumnos.filter((a) => a.cursoId === curso.id).map((a) => claveNombre(a.nombre, a.apellidos)))
  const partes = (f: FilaImportada) => ({ nombre: f.palabras.slice(0, f.corte).join(' '), apellidos: f.palabras.slice(f.corte).join(' ') })
  const duplicada = (f: FilaImportada) => { const p = partes(f); return existentes.has(claveNombre(p.nombre, p.apellidos)) }
  const incluidas = filas.filter((f) => !excluidas.has(f.fila) && !duplicada(f))

  const abrir = async (archivo?: File) => {
    if (!archivo) return
    setError(undefined)
    try {
      const r = await leerArchivo(archivo)
      setResultado(r)
      setFilas(r.filas)
      setExcluidas(new Set())
      setGrupo(r.filas.find((f) => f.grupo)?.grupo ?? r.hoja)
    } catch (e) {
      setResultado(undefined)
      setError(e instanceof Error && e.message === 'sin-columna-nombre' ? t.sinColumnaNombre : t.errorArchivo)
    }
  }

  const mover = (fila: number, delta: number) => setFilas((fs) => fs.map((f) =>
    f.fila === fila ? { ...f, corte: Math.min(f.palabras.length - 1, Math.max(1, f.corte + delta)) } : f))

  const importar = () => {
    const nuevos: Alumno[] = []
    const contactos: ContactoFamiliar[] = []
    for (const f of incluidas) {
      const { nombre, apellidos } = partes(f)
      const id = crypto.randomUUID()
      nuevos.push({
        id, nombre, apellidos,
        fechaNacimiento: f.nacimiento,
        cursoId: curso.id,
        grupo: (f.grupo ?? grupo).trim(),
        localidad: f.localidad,
        autorizacionImagen: f.autorizacionImagen,
        numeroLista: f.numero,
        estado: 'activo',
      })
      if (conContactos) {
        f.tutores.forEach((tu, i) => contactos.push({
          id: crypto.randomUUID(),
          alumnoIds: [id],
          nombre: tu.nombre ?? `${t.tutorN} ${tu.numero}`,
          relacion: `${t.tutorN} ${tu.numero}`,
          telefonos: tu.telefonos,
          correos: tu.correos,
          preferente: i === 0,
          lengua: 'oc',
        }))
      }
    }
    importarAlumnado(nuevos, contactos)
    navigate('/alumnado')
  }

  return (
    <>
      <PageHeader title={t.importarTitulo} icon={Upload} />
      <div className="mx-auto max-w-3xl px-4 pt-3 pb-8">
        <Link to="/alumnado" className="mb-3 inline-flex items-center gap-1 text-accent">
          <ChevronLeft size={18} /> {t.alumnado}
        </Link>

        <Card className="p-4">
          <p className="text-[15px]">{t.importarAyuda}</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-on-accent">
            <FileSpreadsheet size={18} aria-hidden /> {t.elegirArchivo}
            <input
              id="archivo-importar"
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => { void abrir(e.target.files?.[0]); e.target.value = '' }}
            />
          </label>
          <p className="mt-3 flex items-start gap-2 text-sm text-warn">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden /> {t.avisoSinCifrar}
          </p>
          {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        </Card>

        {resultado && (
          <>
            <p className="mt-4 text-sm text-muted">
              {t.columnasReconocidas}: {resultado.columnas.join(' · ')}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-muted">{t.grupo}</span>
                <input value={grupo} onChange={(e) => setGrupo(e.target.value)} className={claseInput} />
              </label>
              <label className="flex min-h-11 items-center gap-3 self-end">
                <input type="checkbox" checked={conContactos} onChange={(e) => setConContactos(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
                <span>{t.incluirContactos}</span>
              </label>
            </div>
            <p className="mt-3 text-sm text-muted">{t.separarNombre}</p>

            <ul className="mt-2 space-y-2">
              {filas.map((f) => {
                const dup = duplicada(f)
                const fuera = excluidas.has(f.fila) || dup
                const revisar = f.tutores.some((tu) => tu.revisar)
                return (
                  <li key={f.fila} className={clsx('rounded-2xl border border-line bg-surface p-3', fuera && 'opacity-50')}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={partes(f).nombre}
                        disabled={dup}
                        checked={!fuera}
                        onChange={() => setExcluidas((s) => { const n = new Set(s); if (n.has(f.fila)) n.delete(f.fila); else n.add(f.fila); return n })}
                        className="mt-1.5 size-5 shrink-0 accent-[var(--color-accent)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1">
                          {f.numero !== undefined && <span className="mr-1 w-6 text-sm text-muted tabular-nums">{f.numero}</span>}
                          <button type="button" aria-label="◀" onClick={() => mover(f.fila, -1)} disabled={f.corte <= 1} className="rounded-md p-1 text-muted disabled:opacity-30">
                            <ChevronLeft size={16} />
                          </button>
                          <span className="font-semibold text-accent">{partes(f).nombre}</span>
                          <span className="mx-0.5 h-5 w-px bg-line" aria-hidden />
                          <span className="font-medium">{partes(f).apellidos}</span>
                          <button type="button" aria-label="▶" onClick={() => mover(f.fila, 1)} disabled={f.corte >= f.palabras.length - 1} className="rounded-md p-1 text-muted disabled:opacity-30">
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          {f.nacimiento && <span>{fechaCorta(f.nacimiento, lang).split(' ')[1]}/{f.nacimiento.slice(0, 4)}</span>}
                          {f.localidad && <span>{f.localidad}</span>}
                          {f.autorizacionImagen && <span className="inline-flex items-center gap-1"><ImageIcon size={12} aria-hidden /><Check size={12} aria-label={t.autorizacionImagen} /></span>}
                          {conContactos && f.tutores.length > 0 && <span>{f.tutores.length} {t.contactosN}</span>}
                          {revisar && <span className="inline-flex items-center gap-1 font-medium text-warn"><AlertTriangle size={12} aria-hidden /> {t.revisar}</span>}
                          {dup && <span className="font-medium text-danger">{t.yaExiste}</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <button
              onClick={importar}
              disabled={incluidas.length === 0}
              className="sticky bottom-4 mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-on-accent shadow-lg disabled:opacity-40"
            >
              <Upload size={18} aria-hidden /> {t.importar} · {incluidas.length}
            </button>
          </>
        )}
      </div>
    </>
  )
}
