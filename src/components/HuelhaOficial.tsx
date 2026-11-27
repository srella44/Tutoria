import { Download, FileCheck2, FilePlus2, Lock, PenLine, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../data/store'
import type { Registro } from '../data/types'
import { gruposEscoti, motivosEntrevista, useI18n } from '../lib/i18n'
import { CampoPdfError, comprobarOriginal, nombreOficial, plantillaIncluida, rellenarPdfOficial, type ModeloOficial } from '../lib/pdfOficial'
import { FirmaPdf } from './FirmaPdf'
import { ModoFirma } from './ModoFirma'
import { aBase64, deBase64, descargarPdf, huella, huellaCorta, LIMITE_SYNC_PDF } from '../lib/actas'
import { Card } from './ui'

export function HuelhaOficial({ cita, modelo, paso, datosIniciales }: {
  cita: Registro
  modelo: ModeloOficial
  paso: number
  datosIniciales: Record<string, string>
}) {
  const { t, lang } = useI18n()
  const { borradores, borradoresListos, estadoBorradores, setBorrador, plantillas, guardarPlantilla, actas, firmarActa, nuevaVersionActa, borrarActa, setNotaPuntoCita } = useStore()
  // La plantilla oficial se elige una vez y queda guardada (cifrada y sincronizada).
  const guardadaPlantilla = plantillas.find((p) => p.id === modelo)
  const original = useMemo(() => plantillaIncluida(modelo) ?? (guardadaPlantilla ? deBase64(guardadaPlantilla.pdf) : undefined), [modelo, guardadaPlantilla])
  const versiones = actas.filter((a) => a.registroId === cita.id).sort((a, b) => b.version - a.version)
  const bloqueada = cita.estado === 'firmado'
  const [modoFirma, setModoFirma] = useState(false)
  const [nuevaVersion, setNuevaVersion] = useState(false)
  const datosGuardados = borradores[cita.id]
  const datos = datosGuardados ?? { valores: datosIniciales, motivos: [], firmas: [] }
  const { motivos, firmas } = datos
  const fechaInicial = datosIniciales.fecha ?? ''
  const valores = { ...datos.valores }
  if (!bloqueada) {
    // Borradores antiguos: solo el día en la fecha, o el grupo entero («4au B») en «Classa» con «Cors» vacío.
    if (valores.fecha && !valores.fecha.includes(':') && fechaInicial.startsWith(valores.fecha)) valores.fecha = fechaInicial
    const grupoInicial = [datosIniciales.curso, datosIniciales.clase].filter(Boolean).join(' ')
    if (!valores.curso?.trim() && datosIniciales.curso && valores.clase?.trim() === grupoInicial) {
      valores.curso = datosIniciales.curso
      valores.clase = datosIniciales.clase ?? ''
    }
  }
  // Si se prepararon puntos, «Aspèctes a tractar» se escribe por puntos (negrita + cursiva).
  const puntos = modelo === 'familia' ? cita.puntos ?? [] : []
  const valoresPdf = valores
  const puntosPdf = puntos.length > 0 ? puntos.map((p) => ({ titulo: p.texto, notas: p.notas ?? '' })) : undefined
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
    alumno: t.nombreAlumno, fecha: t.fechaYHora, curso: t.pdfCurso, clase: t.pdfClase,
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
      setBorrador(cita, { ...datos, valores: { ...valores, [id]: valor } })
      invalidar()
    }
    const estilo = 'mt-1 block w-full rounded-xl border border-line bg-bg px-3 py-2 text-base text-ink'
    return (
      <label key={id} className="block min-w-0 text-sm font-medium text-muted">
        {etiquetas[id]}
        {filas ? <textarea rows={filas} readOnly={bloqueada} value={valores[id] ?? ''} onChange={(e) => cambiar(e.target.value)} className={estilo} /> :
          <input readOnly={bloqueada} value={valores[id] ?? ''} onChange={(e) => cambiar(e.target.value)} className={estilo} />}
      </label>
    )
  }

  const vistaPrevia = async () => {
    if (!original) return
    setError('')
    setOcupado(true)
    try {
      const bytes = await rellenarPdfOficial(modelo, original, valoresPdf, motivos, [], undefined, puntosPdf)
      setVista(URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/pdf' })))
    } catch (fallo) {
      setError(fallo instanceof CampoPdfError
        ? `${t.pdfTextoCampo} · ${etiquetas[fallo.campo] ?? fallo.campo}. ${t.pdfLimite}`
        : t.pdfError)
    } finally {
      setOcupado(false)
    }
  }

  /** Acta definitiva: PDF firmado con sello de versión y fecha, huella SHA-256 y cita bloqueada. */
  const actaDefinitiva = async () => {
    if (!original) return
    setError('')
    setOcupado(true)
    try {
      const version = (versiones[0]?.version ?? 0) + 1
      const ahora = new Date()
      const fecha = ahora.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
      const sello = `TUTOR-ia · ${t.version} ${version} · ${t.firmadoEl} ${fecha}`
      const bytes = await rellenarPdfOficial(modelo, original, valoresPdf, motivos, firmas.map((firma) => firma ?? undefined), sello, puntosPdf)
      const nombre = `${base} - v${version}.pdf`
      firmarActa({
        id: crypto.randomUUID(), registroId: cita.id, version, fecha: ahora.toISOString(),
        huella: await huella(bytes), firmantes: etiquetasFirma, nombre, pdf: aBase64(bytes),
      })
      if (bytes.length > LIMITE_SYNC_PDF) setError(t.actaGrandeSinSync)
    } catch (fallo) {
      setError(fallo instanceof CampoPdfError
        ? `${t.pdfTextoCampo} · ${etiquetas[fallo.campo] ?? fallo.campo}. ${t.pdfLimite}`
        : t.pdfError)
    } finally {
      setOcupado(false)
    }
  }

  const firmasCompletas = etiquetasFirma.every((_, i) => !!firmas[i])
  const casillasFirma = (
    <>
      {etiquetasFirma.map((titulo, i) => (
        <FirmaPdf key={i} titulo={titulo} imagen={firmas[i] ?? undefined} onChange={(imagen) => {
          setBorrador(cita, { ...datos, valores, firmas: etiquetasFirma.map((_, indice) =>
            indice === i ? imagen ?? null : firmas[indice] ?? null) })
          setError('')
        }} />
      ))}
    </>
  )

  if (paso === 0) return null
  if (!borradoresListos) return <p role="status" className="text-sm text-muted">{t.pdfCargando}</p>

  return (
    <div className="space-y-3">
      {!original ? (
        <Card className="space-y-3 p-4">
          <h2 className="font-bold">{t.plantillaOficial} · {nombreOficial(modelo)}</h2>
          <p className="text-sm text-muted">{t.plantillaUnaVez}</p>
          <label className="block text-sm font-semibold">
            {t.seleccionPdf}
            <input type="file" accept="application/pdf,.pdf" className="mt-2 block w-full" onChange={async (e) => {
              const archivo = e.currentTarget.files?.[0]
              if (!archivo) return
              setError('')
              try {
                const bytes = await archivo.arrayBuffer()
                if (await comprobarOriginal(modelo, bytes)) guardarPlantilla({ id: modelo, nombre: archivo.name, pdf: aBase64(new Uint8Array(bytes)) })
                else setError(t.pdfIncorrecto)
              } catch {
                setError(t.pdfError)
              }
            }} />
          </label>
        </Card>
      ) : (
        <>
          {bloqueada && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3">
              <ShieldCheck size={20} className="shrink-0 text-emerald-700" aria-hidden />
              <p className="min-w-0 flex-1 text-sm text-emerald-800">
                <span className="font-semibold">{t.actaFirmada} · {t.version} {versiones[0]?.version}</span> · {t.actaBloqueadaAyuda}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p role="status" className={guardado === 'fallo' ? 'text-sm text-danger' : 'text-sm text-muted'}>
              {guardado === 'guardando' ? t.pdfGuardando : guardado === 'fallo' ? t.pdfSinGuardar : guardado === 'guardado' ? t.pdfGuardado : t.pdfBorrador}
            </p>
            {datosGuardados && !bloqueada && (
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
                            <input type="checkbox" disabled={bloqueada} checked={motivos.includes(i)} className="size-5 shrink-0 accent-accent"
                              onChange={() => {
                                setBorrador(cita, {
                                  ...datos, valores, motivos: motivos.includes(i) ? motivos.filter((m) => m !== i) : [...motivos, i],
                                })
                                invalidar()
                              }} />
                            {motivo}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </Card>
                  {puntos.length > 0 ? (
                    <Card className="space-y-3 p-4">
                      <h2 className="font-bold">{t.pdfAspectos}</h2>
                      {puntos.map((punto, i) => (
                        <details key={punto.id} open className="rounded-xl border border-line">
                          <summary className="cursor-pointer px-3 py-2 font-semibold">{i + 1}. {punto.texto}</summary>
                          <label className="block px-3 pb-3 text-sm text-muted">
                            {t.notasPunto}
                            <textarea rows={4} readOnly={bloqueada} value={punto.notas ?? ''}
                              onChange={(e) => { setNotaPuntoCita(cita.id, punto.id, e.target.value); invalidar() }}
                              className="mt-1 block w-full rounded-xl border border-line bg-bg px-3 py-2 text-base text-ink" />
                          </label>
                        </details>
                      ))}
                      {campo('acuerdos', 4)}
                    </Card>
                  ) : (
                    <Card className="space-y-3 p-4">{campo('aspectos', 7)}{campo('acuerdos', 4)}</Card>
                  )}
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
              <button type="button" disabled={ocupado} onClick={() => void vistaPrevia()}
                className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-40">
                <FileCheck2 size={18} aria-hidden /> {t.pdfVistaPrevia}
              </button>
              {vista && <>
                <iframe title={t.pdfVistaPrevia} src={vista} className="h-[65vh] w-full rounded-xl border border-line" />
                <a href={vista} download={`${base}.pdf`} className="inline-flex min-h-11 items-center font-semibold text-accent">{t.pdfVistaPrevia}</a>
              </>}
            </Card>
          )}

          {paso === 3 && (bloqueada ? (
            <Card className="p-4 text-sm text-muted">{t.actaBloqueadaAyuda}</Card>
          ) : (
            <>
              <button type="button" onClick={() => { setModoFirma(true); void vistaPrevia() }}
                className="accion-coral flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-semibold">
                <Lock size={18} aria-hidden /> {t.modoFirma}
              </button>
              <p className="text-sm text-muted">{t.modoFirmaExplica}</p>
              {casillasFirma}
            </>
          ))}

          {paso === 4 && (
            <Card className="space-y-4 p-4">
              {!bloqueada && (
                <>
                  <p className="text-sm text-muted">{firmasCompletas ? t.actaDefinitivaAyuda : t.faltanFirmas}</p>
                  <button type="button" disabled={ocupado || !firmasCompletas} onClick={() => void actaDefinitiva()}
                    className="accion-coral inline-flex min-h-11 items-center gap-2 rounded-xl px-4 font-semibold disabled:opacity-40">
                    <PenLine size={18} aria-hidden /> {t.actaDefinitiva}
                  </button>
                </>
              )}
              {versiones.length > 0 && (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {versiones.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                      <ShieldCheck size={18} className="shrink-0 text-emerald-700" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{t.version} {v.version} · {new Date(v.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        <p className="truncate font-mono text-xs text-muted" title={v.huella}>{t.huella}: {huellaCorta(v.huella)}</p>
                      </div>
                      <button type="button" onClick={() => descargarPdf(v.pdf, v.nombre)}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-accent px-3 text-sm font-semibold text-accent">
                        <Download size={16} aria-hidden /> PDF
                      </button>
                      <BorrarVersion onBorrar={() => borrarActa(v.id)} />
                    </li>
                  ))}
                </ul>
              )}
              {bloqueada && (
                nuevaVersion ? (
                  <div className="space-y-2 rounded-xl bg-warn-soft p-3 text-sm">
                    <p>{t.nuevaVersionAviso}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setNuevaVersion(false)} className="min-h-11 flex-1 rounded-xl border border-line bg-surface">{t.cancelar}</button>
                      <button type="button" onClick={() => { nuevaVersionActa(cita.id); setNuevaVersion(false); invalidar() }}
                        className="min-h-11 flex-1 rounded-xl bg-accent font-semibold text-on-accent">{t.nuevaVersion}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setNuevaVersion(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold">
                    <FilePlus2 size={16} aria-hidden /> {t.nuevaVersion}
                  </button>
                )
              )}
            </Card>
          )}
        </>
      )}
      {modoFirma && (
        <ModoFirma titulo={`${datosIniciales.alumno || ''} · ${nombreOficial(modelo).replace(/\.pdf$/, '')}`} onSalir={() => setModoFirma(false)}>
          {vista
            ? <iframe title={t.pdfVistaPrevia} src={vista} className="h-[45vh] w-full rounded-xl border border-line bg-white" />
            : <p className="text-sm text-muted">{t.pdfCargando}</p>}
          {casillasFirma}
          {firmasCompletas && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{t.firmasListas}</p>}
        </ModoFirma>
      )}
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
    </div>
  )
}

// Borrado en dos toques de una versión firmada.
function BorrarVersion({ onBorrar }: { onBorrar: () => void }) {
  const { t } = useI18n()
  const [armado, setArmado] = useState(false)
  useEffect(() => {
    if (!armado) return
    const espera = setTimeout(() => setArmado(false), 4000)
    return () => clearTimeout(espera)
  }, [armado])
  return (
    <button type="button" onClick={() => (armado ? onBorrar() : setArmado(true))} onBlur={() => setArmado(false)}
      aria-label={armado ? t.tocaConfirmar : t.borrar} title={armado ? t.tocaConfirmar : t.borrar}
      className={armado
        ? 'inline-flex min-h-11 items-center gap-1 rounded-xl bg-danger-soft px-3 text-sm font-semibold text-danger'
        : 'grid size-11 place-items-center rounded-xl text-muted hover:bg-bg hover:text-danger'}>
      <Trash2 size={18} aria-hidden />
      {armado && t.borrar}
    </button>
  )
}
