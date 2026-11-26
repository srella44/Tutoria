import { Download, FileCheck2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStore } from '../data/store'
import type { Registro } from '../data/types'
import { gruposEscoti, motivosEntrevista, useI18n } from '../lib/i18n'
import { CampoPdfError, comprobarOriginal, nombreOficial, plantillaIncluida, rellenarPdfOficial, type ModeloOficial } from '../lib/pdfOficial'
import { FirmaPdf } from './FirmaPdf'
import { Card } from './ui'

export function HuelhaOficial({ cita, modelo, paso, datosIniciales }: {
  cita: Registro
  modelo: ModeloOficial
  paso: number
  datosIniciales: Record<string, string>
}) {
  const { t, lang } = useI18n()
  const [original, setOriginal] = useState(() => plantillaIncluida(modelo))
  const { borradores, borradoresListos, estadoBorradores, setBorrador } = useStore()
  const datosGuardados = borradores[cita.id]
  const datos = datosGuardados ?? { valores: datosIniciales, motivos: [], firmas: [] }
  const { valores, motivos, firmas } = datos
  const guardado = estadoBorradores[cita.id]
  const [vista, setVista] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const familia = modelo === 'familia'
  const etiquetasFirma = familia ? [t.pdfFamilha, t.pdfMestres] : [t.pdfSignatura]
  const base = nombreOficial(modelo).replace(/\.pdf$/, '')
  const grupos = gruposEscoti[lang]
  const preguntas = grupos.flatMap((grupo) => grupo.preguntas)
  const etiquetas: Record<string, string> = {
    alumno: t.nombreAlumno, fecha: t.fechaLbl, curso: t.pdfCurso, clase: t.pdfClase,
    docente: t.pdfDocente, asistentes: t.pdfAsistentes, aspectos: t.pdfAspectos,
    acuerdos: familia ? t.pdfAcuerdosPropuestas : t.pdfAcuerdos, propuestas: t.pdfPropuestas,
    ...Object.fromEntries(preguntas.map((pregunta, i) => [`q${i}`, pregunta])),
  }

  useEffect(() => {
    if (vista) return () => URL.revokeObjectURL(vista)
  }, [vista])

  const invalidar = () => {
    setVista('')
    setError('')
  }

  const campo = (id: string, filas?: number) => {
    const cambiar = (valor: string) => {
      setBorrador(cita, { ...datos, valores: { ...valores, [id]: valor }, firmas: [] })
      invalidar()
    }
    const estilo = 'mt-1 block w-full rounded-xl border border-line bg-bg px-3 py-2 text-base text-ink'
    return (
      <label key={id} className="block min-w-0 text-sm font-medium text-muted">
        {etiquetas[id]}
        {filas ? <textarea rows={filas} value={valores[id] ?? ''} onChange={(e) => cambiar(e.target.value)} className={estilo} /> :
          <input value={valores[id] ?? ''} onChange={(e) => cambiar(e.target.value)} className={estilo} />}
      </label>
    )
  }

  const generar = async (firmado: boolean) => {
    if (!original) return
    setError('')
    setOcupado(true)
    try {
      const bytes = await rellenarPdfOficial(modelo, original, valores, motivos, firmado ? firmas.map((firma) => firma ?? undefined) : [])
      const blob = new Blob([bytes.slice().buffer], { type: 'application/pdf' })
      if (!firmado) {
        setVista(URL.createObjectURL(blob))
        return
      }
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.download = `${base} - ${t.pdfSignatura}.pdf`
      enlace.href = url
      enlace.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (fallo) {
      setError(fallo instanceof CampoPdfError
        ? `${t.pdfTextoCampo} · ${etiquetas[fallo.campo] ?? fallo.campo}. ${t.pdfLimite}`
        : t.pdfError)
    } finally {
      setOcupado(false)
    }
  }

  if (paso === 0) return null
  if (!borradoresListos) return <p role="status" className="text-sm text-muted">{t.pdfCargando}</p>

  return (
    <div className="space-y-3">
      {!original ? (
        <Card className="space-y-3 p-4">
          <h2 className="font-bold">{t.plantillaOficial} · {nombreOficial(modelo)}</h2>
          <label className="block text-sm font-semibold">
            {t.seleccionPdf}
            <input type="file" accept="application/pdf,.pdf" className="mt-2 block w-full" onChange={async (e) => {
              const archivo = e.currentTarget.files?.[0]
              if (!archivo) return
              setError('')
              try {
                const bytes = await archivo.arrayBuffer()
                if (await comprobarOriginal(modelo, bytes)) setOriginal(new Uint8Array(bytes))
                else setError(t.pdfIncorrecto)
              } catch {
                setError(t.pdfError)
              }
            }} />
          </label>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className={guardado === 'fallo' ? 'text-sm text-danger' : 'text-sm text-muted'}>
              {guardado === 'guardando' ? t.pdfGuardando : guardado === 'fallo' ? t.pdfSinGuardar : guardado === 'guardado' ? t.pdfGuardado : t.pdfBorrador}
            </p>
            {datosGuardados && (
              <button type="button" className="min-h-11 rounded-xl px-3 text-sm font-semibold text-danger hover:bg-danger-soft"
                onClick={() => {
                  if (!window.confirm(t.pdfBorrarConfirmar)) return
                  setBorrador(cita)
                  invalidar()
                }}
              >{t.pdfBorrarBorrador}</button>
            )}
          </div>
          {paso === 1 && (
            <>
              <Card className="grid gap-3 p-4 sm:grid-cols-2">
                {['alumno', 'fecha', 'curso', 'clase', 'docente', ...(familia ? ['asistentes'] : [])].map((id) => campo(id))}
              </Card>
              {familia ? (
                <>
                  <Card className="p-4">
                    <fieldset>
                      <legend className="mb-2 font-bold">{t.pdfMotivo}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {motivosEntrevista[lang].map((motivo, i) => (
                          <label key={i} className="flex min-h-11 items-center gap-2 rounded-xl bg-bg px-3 text-sm">
                            <input type="checkbox" checked={motivos.includes(i)} className="size-5 shrink-0 accent-accent"
                              onChange={() => {
                                setBorrador(cita, {
                                  ...datos, motivos: motivos.includes(i) ? motivos.filter((m) => m !== i) : [...motivos, i], firmas: [],
                                })
                                invalidar()
                              }} />
                            {motivo}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </Card>
                  <Card className="space-y-3 p-4">{campo('aspectos', 7)}{campo('acuerdos', 4)}</Card>
                </>
              ) : (
                <>
                  {grupos.map(({ titulo, preguntas: lista }, g) => {
                    const inicio = grupos.slice(0, g).reduce((total, grupo) => total + grupo.preguntas.length, 0)
                    return (
                      <details key={g} open={g === 0} className="rounded-2xl border border-line bg-surface">
                        <summary className="cursor-pointer px-4 py-3 font-semibold">{titulo}</summary>
                        <div className="space-y-3 px-4 pb-4">{lista.map((_, i) => campo(`q${inicio + i}`, 2))}</div>
                      </details>
                    )
                  })}
                  <Card className="space-y-3 p-4">{campo('propuestas', 3)}{campo('acuerdos', 3)}</Card>
                </>
              )}
            </>
          )}

          {paso === 2 && (
            <Card className="space-y-3 p-4">
              <p className="text-sm text-muted">{t.pdfRevision}</p>
              <button type="button" disabled={ocupado} onClick={() => void generar(false)}
                className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-40">
                <FileCheck2 size={18} aria-hidden /> {t.pdfVistaPrevia}
              </button>
              {vista && <>
                <iframe title={t.pdfVistaPrevia} src={vista} className="h-[65vh] w-full rounded-xl border border-line" />
                <a href={vista} download={`${base}.pdf`} className="inline-flex min-h-11 items-center font-semibold text-accent">{t.pdfVistaPrevia}</a>
              </>}
            </Card>
          )}

          {paso === 3 && (
            <>
              <p className="text-sm text-muted">{t.pdfFirmaMano}</p>
              {etiquetasFirma.map((titulo, i) => (
                <FirmaPdf key={i} titulo={titulo} imagen={firmas[i] ?? undefined} onChange={(imagen) => {
                  setBorrador(cita, { ...datos, firmas: etiquetasFirma.map((_, indice) =>
                    indice === i ? imagen ?? null : firmas[indice] ?? null) })
                  setError('')
                }} />
              ))}
            </>
          )}

          {paso === 4 && (
            <Card className="p-4">
              <button type="button" disabled={ocupado || !etiquetasFirma.every((_, i) => !!firmas[i])}
                onClick={() => void generar(true)}
                className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-40">
                <Download size={18} aria-hidden /> {t.pdfDescarga}
              </button>
            </Card>
          )}
        </>
      )}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
    </div>
  )
}
