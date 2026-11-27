// Importar autorizaciones desde cualquier Excel/CSV, con vista previa (src/lib/importarAutorizaciones.ts).
import clsx from 'clsx'
import { Check, ChevronLeft, FileSpreadsheet, Minus, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { estiloEstado } from '../components/Autorizaciones'
import { Card, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { EstadoAutorizacion, TipoAutorizacion } from '../data/types'
import { useI18n } from '../lib/i18n'
import { leerAutorizaciones, valorPara, type LecturaAutorizaciones } from '../lib/importarAutorizaciones'

export function ImportarAutorizaciones() {
  const { t } = useI18n()
  const { alumnosActivos, tiposAutorizacion, aplicarAutorizaciones } = useStore()
  const navigate = useNavigate()
  const [lectura, setLectura] = useState<LecturaAutorizaciones>()
  const [destinos, setDestinos] = useState<Record<number, string>>({})
  const [error, setError] = useState<string>()

  const abrir = async (archivo?: File) => {
    if (!archivo) return
    setError(undefined)
    setLectura(undefined)
    try {
      const l = await leerAutorizaciones(archivo, alumnosActivos, tiposAutorizacion)
      if (!l.columnas.length) return setError(t.sinColumnasAut)
      setLectura(l)
      setDestinos(Object.fromEntries(l.columnas.map((c) => [c.indice, c.destino])))
    } catch (e) {
      setError(e instanceof Error && e.message === 'sin-alumnos' ? t.sinAlumnosArchivo : t.errorArchivo)
    }
  }

  const reconocidas = lectura?.filas.filter((f) => f.alumno) ?? []
  const sinReconocer = lectura?.filas.filter((f) => !f.alumno) ?? []

  const aplicar = () => {
    if (!lectura) return
    const nuevos: TipoAutorizacion[] = []
    const idDe: Record<number, string> = {}
    for (const c of lectura.columnas) {
      const d = destinos[c.indice]
      if (d === 'ignorar') continue
      if (d === 'nueva') {
        const id = crypto.randomUUID()
        nuevos.push({ id, nombre: c.cabecera, icono: 'escudo', orden: tiposAutorizacion.length + nuevos.length, tresEstados: c.tresEstados || undefined })
        idDe[c.indice] = id
      } else idDe[c.indice] = d
    }
    const valores: Record<string, Record<string, EstadoAutorizacion>> = {}
    for (const f of reconocidas) {
      for (const [indice, tipoId] of Object.entries(idDe)) {
        const v = valorPara(f.celdas[Number(indice)] ?? null)
        if (v) (valores[f.alumno!.id] ??= {})[tipoId] = v
      }
    }
    aplicarAutorizaciones(nuevos, valores)
    navigate('/autorizaciones')
  }

  return (
    <>
      <PageHeader title={t.importarAutorizaciones} icon={Upload} />
      <div className="mx-auto max-w-3xl px-4 pt-3 pb-8">
        <Link to="/autorizaciones" className="mb-3 inline-flex items-center gap-1 text-accent">
          <ChevronLeft size={18} /> {t.autorizaciones}
        </Link>
        <Card className="p-4">
          <p className="text-[15px]">{t.importarAutAyuda}</p>
          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 font-semibold text-on-accent">
            <FileSpreadsheet size={18} aria-hidden /> {t.elegirArchivo}
            <input id="archivo-autorizaciones" type="file" className="sr-only"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => { void abrir(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        </Card>

        {lectura && (
          <>
            <p className="mt-4 text-sm text-muted">
              {lectura.hoja}{lectura.columnaNombre && ` · ${lectura.columnaNombre}`} · {t.reconocidos}: <strong className="text-ink">{reconocidas.length}</strong>
            </p>
            {sinReconocer.length > 0 && (
              <details className="mt-2 rounded-xl border border-warn bg-warn-soft px-3 py-2 text-sm text-warn">
                <summary className="cursor-pointer font-medium">{t.noReconocidos}: {sinReconocer.length}</summary>
                <ul className="mt-1 list-disc pl-5">{sinReconocer.map((f) => <li key={f.fila}>{f.nombre}</li>)}</ul>
              </details>
            )}
            <ul className="mt-3 space-y-2">
              {lectura.columnas.map((c) => (
                <li key={c.indice} className={clsx('rounded-2xl border border-line bg-surface p-3', destinos[c.indice] === 'ignorar' && 'opacity-60')}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 font-semibold">{c.cabecera}</span>
                    <select value={destinos[c.indice]} onChange={(e) => setDestinos((d) => ({ ...d, [c.indice]: e.target.value }))}
                      className="max-w-[60%] rounded-lg border border-line bg-bg px-2 py-1.5 text-sm" aria-label={c.cabecera}>
                      {tiposAutorizacion.map((tipo) => <option key={tipo.id} value={tipo.id}>→ {tipo.nombre}</option>)}
                      <option value="nueva">+ {t.nuevaAutorizacion}: {c.cabecera}</option>
                      <option value="ignorar">{t.ignorar}</option>
                    </select>
                  </div>
                  <p className="mt-1 flex flex-wrap gap-3 text-sm">
                    {c.cuenta.si > 0 && <span className={clsx('inline-flex items-center gap-1', estiloEstado.si.marca)}><Check size={14} strokeWidth={3} aria-hidden /> {c.tresEstados ? t.estadoTostemp : t.estadoSi} {c.cuenta.si}</span>}
                    {c.cuenta.aviatges > 0 && <span className={clsx('inline-flex items-center gap-1', estiloEstado.aviatges.marca)}><Minus size={14} strokeWidth={3} aria-hidden /> {t.estadoAViatges} {c.cuenta.aviatges}</span>}
                    {c.cuenta.no > 0 && <span className={clsx('inline-flex items-center gap-1', estiloEstado.no.marca)}><X size={14} strokeWidth={3} aria-hidden /> {t.estadoNo} {c.cuenta.no}</span>}
                    {c.cuenta.vacio > 0 && <span className="text-muted">{t.pendiente} {c.cuenta.vacio}</span>}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">{t.vaciasNoCambian}</p>
            <button onClick={aplicar} disabled={!reconocidas.length}
              className="sticky bottom-24 mt-4 flex min-h-12 md:bottom-4 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-on-accent shadow-lg disabled:opacity-40">
              <Upload size={18} aria-hidden /> {t.aplicarA} {reconocidas.length} {t.alumnosN.toLowerCase()}
            </button>
          </>
        )}
      </div>
    </>
  )
}
