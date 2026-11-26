import { Download, FileLock2, Lock, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, Empty, PageHeader } from '../components/ui'
import {
  abrirBanco, alumnoPorArchivo, asignarInforme, existeBanco, guardarAlumnadoInformes, guardarInforme,
  leerAlumnadoInformes, listarInformes, quitarInforme, recuperarInforme, type FichaInforme,
} from '../data/informesPrivados'
import { useI18n } from '../lib/i18n'

export function InformesPrivados() {
  const { t } = useI18n()
  const [filtros] = useSearchParams()
  const alumnoFiltro = filtros.get('alumno')
  const tipoFiltro = filtros.get('archivo')
  const [tipoArchivo, setTipoArchivo] = useState<FichaInforme['tipo']>(() => tipoFiltro === 'reunion' ? 'reunion' : 'informe')
  const [existe, setExiste] = useState<boolean>()
  const [disponible, setDisponible] = useState(() => !!globalThis.crypto?.subtle && !!globalThis.indexedDB)
  const [clave, setClave] = useState<CryptoKey>()
  const [frase, setFrase] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [informes, setInformes] = useState<FichaInforme[]>([])
  const [alumnado, setAlumnado] = useState<string[]>([])
  const [listaAlumnado, setListaAlumnado] = useState('')
  const [curso, setCurso] = useState('')
  const [trimestre, setTrimestre] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    if (!globalThis.crypto?.subtle || !globalThis.indexedDB) return
    existeBanco().then(
      (resultado) => { if (activo) setExiste(resultado) },
      () => { if (activo) setDisponible(false) },
    )
    return () => { activo = false }
  }, [])

  const desbloquear = async (e: FormEvent) => {
    e.preventDefault()
    if (ocupado || existe === undefined) return
    if (!existe && frase !== confirmacion) {
      setError(t.informesNoCoinciden)
      return
    }
    setOcupado(true)
    setError('')
    try {
      const llave = await abrirBanco(frase, !existe)
      setExiste(true)
      const [recuperados, lista] = await Promise.all([listarInformes(llave), leerAlumnadoInformes(llave)])
      setInformes(recuperados)
      setAlumnado(lista)
      setListaAlumnado(lista.join('\n'))
      setClave(llave)
    } catch {
      setError(t.informesErrorAcceso)
    } finally {
      setFrase('')
      setConfirmacion('')
      setOcupado(false)
    }
  }

  const bloquear = () => {
    setClave(undefined)
    setInformes([])
    setAlumnado([])
    setListaAlumnado('')
    setCurso('')
    setTrimestre('')
    setError('')
  }

  const importar = async (archivos: File[]) => {
    if (!clave || ocupado || !archivos.length) return
    setOcupado(true)
    setError('')
    try {
      for (const archivo of archivos) {
        const ficha = await guardarInforme(clave, archivo, curso.trim(), trimestre.trim(), alumnoPorArchivo(archivo.name, alumnado), tipoArchivo)
        setInformes((actuales) => [...actuales, ficha])
      }
    } catch {
      setError(t.informesErrorArchivo)
    } finally {
      setOcupado(false)
    }
  }

  const guardarLista = async (e: FormEvent) => {
    e.preventDefault()
    if (!clave || ocupado) return
    const lista = [...new Set(listaAlumnado.split(/\r?\n/).map((nombre) => nombre.trim()).filter(Boolean))]
    setOcupado(true)
    setError('')
    try {
      await guardarAlumnadoInformes(clave, lista)
      setAlumnado(lista)
      for (const informe of informes.filter((item) => !item.alumno)) {
        const alumno = alumnoPorArchivo(informe.nombre, lista)
        if (!alumno) continue
        const actualizado = await asignarInforme(clave, informe, alumno)
        setInformes((actuales) => actuales.map((item) => item.id === informe.id ? actualizado : item))
      }
    } catch {
      setError(t.informesErrorArchivo)
    } finally {
      setOcupado(false)
    }
  }

  const reasignar = async (informe: FichaInforme, alumno: string) => {
    if (!clave || ocupado) return
    setOcupado(true)
    setError('')
    try {
      const actualizado = await asignarInforme(clave, informe, alumno || undefined)
      setInformes((actuales) => actuales.map((item) => item.id === informe.id ? actualizado : item))
    } catch {
      setError(t.informesErrorArchivo)
    } finally {
      setOcupado(false)
    }
  }

  const descargar = async (informe: FichaInforme) => {
    if (!clave || ocupado) return
    setOcupado(true)
    setError('')
    try {
      const bytes = await recuperarInforme(clave, informe.id)
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }))
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = informe.nombre
      enlace.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError(t.informesErrorArchivo)
    } finally {
      setOcupado(false)
    }
  }

  const eliminar = async (informe: FichaInforme) => {
    if (ocupado || !window.confirm(t.informesConfirmarEliminar)) return
    setOcupado(true)
    setError('')
    try {
      await quitarInforme(informe.id)
      setInformes((actuales) => actuales.filter(({ id }) => id !== informe.id))
    } catch {
      setError(t.informesErrorArchivo)
    } finally {
      setOcupado(false)
    }
  }

  const visibles = informes.filter((item) =>
    (!alumnoFiltro || item.alumno === alumnoFiltro) && (!tipoFiltro || (item.tipo ?? 'informe') === tipoFiltro))
    .sort((a, b) => b.curso.localeCompare(a.curso, undefined, { numeric: true }) ||
      b.trimestre.localeCompare(a.trimestre, undefined, { numeric: true }) || a.nombre.localeCompare(b.nombre))
  const estiloCampo = 'mt-1 block h-11 w-full rounded-xl border border-line bg-bg px-3 text-base'

  return (
    <>
      <PageHeader title={t.bancoInformes} icon={FileLock2} color="azul" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
        <p className="text-sm text-muted">{t.informesLocal}</p>
        {(alumnoFiltro || tipoFiltro) && <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold">{[tipoFiltro === 'reunion' ? t.historialReuniones : t.historialInformes, alumnoFiltro].filter(Boolean).join(' · ')}</h2>
          <Link to="/informes" className="text-sm font-semibold text-accent">{t.todos}</Link>
        </div>}
        {!disponible ? <p role="alert" className="text-danger">{t.informesSinAcceso}</p> : clave ? (
          <>
            <Card className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-bold">{t.informesPrivados}</h2>
                <button onClick={bloquear} disabled={ocupado} className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold disabled:opacity-50">
                  <Lock size={17} aria-hidden /> {t.informesBarrar}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">{t.informesCurso}
                  <input value={curso} onChange={(e) => setCurso(e.target.value)} disabled={ocupado} className={estiloCampo} />
                </label>
                <label className="text-sm font-semibold">{t.informesTrimestre}
                  <input value={trimestre} onChange={(e) => setTrimestre(e.target.value)} disabled={ocupado} className={estiloCampo} />
                </label>
              </div>
              <label className="block text-sm font-semibold">{t.tipoArchivo}
                <select value={tipoArchivo} onChange={(e) => setTipoArchivo(e.target.value === 'reunion' ? 'reunion' : 'informe')}
                  disabled={ocupado} className={estiloCampo}>
                  <option value="informe">{t.informeArchivo}</option>
                  <option value="reunion">{t.reunionArchivo}</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">{t.informesImportar}
                <input type="file" multiple accept=".pdf,.docx,.odt,.txt" disabled={ocupado} className="mt-2 block max-w-full"
                  onChange={(e) => {
                    const archivos = [...(e.currentTarget.files ?? [])].filter((file) => /\.(pdf|docx|odt|txt)$/i.test(file.name))
                    e.currentTarget.value = ''
                    void importar(archivos)
                  }} />
              </label>
            </Card>
            <details className="panel-app rounded-2xl border border-line bg-surface" open={!alumnado.length}>
              <summary className="cursor-pointer px-4 py-3 font-bold">{t.informesListaAlumnos}</summary>
              <form onSubmit={(e) => void guardarLista(e)} className="space-y-3 px-4 pb-4">
                <label className="block text-sm font-semibold">{t.informesNombreLinea}
                  <textarea value={listaAlumnado} onChange={(e) => setListaAlumnado(e.target.value)} disabled={ocupado}
                    rows={5} className="mt-1 block w-full rounded-xl border border-line bg-bg p-3 text-base" />
                </label>
                <button type="submit" disabled={ocupado} className="min-h-11 rounded-xl bg-accent-soft px-3 text-sm font-semibold text-accent">
                  {t.informesGuardarLista}
                </button>
              </form>
            </details>
            {visibles.length ? (
              [undefined, ...[...new Set(visibles.flatMap(({ alumno }) => alumno ? [alumno] : []))].sort((a, b) => a.localeCompare(b))]
                .map((alumno) => {
                  const grupo = visibles.filter((item) => item.alumno === alumno)
                  if (!grupo.length) return null
                  return (
                    <Card key={alumno ?? ''}>
                      <h2 className="flex items-center gap-2 border-b border-line p-3 font-bold">
                        {alumno ?? t.informesSinAsignar}
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">{grupo.length}</span>
                      </h2>
                      <ul>
                        {grupo.map((informe) => (
                          <li key={informe.id} className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 last:border-0">
                            <div className="min-w-0 flex-1 wrap-anywhere">
                              <p className="font-semibold">{informe.nombre}</p>
                              <p className="text-xs text-muted">{[informe.tipo === 'reunion' ? t.reunionArchivo : t.informeArchivo, informe.curso, informe.trimestre].filter(Boolean).join(' · ')}</p>
                            </div>
                            {alumnado.length > 0 && (
                              <select value={informe.alumno ?? ''} disabled={ocupado}
                                aria-label={`${t.informesAsignarAlumno} · ${informe.nombre}`}
                                onChange={(e) => void reasignar(informe, e.target.value)}
                                className="min-h-11 max-w-full rounded-xl border border-line bg-bg px-2 text-sm">
                                <option value="">{t.informesSinAsignar}</option>
                                {informe.alumno && !alumnado.includes(informe.alumno) && <option value={informe.alumno}>{informe.alumno}</option>}
                                {alumnado.map((nombre) => <option key={nombre}>{nombre}</option>)}
                              </select>
                            )}
                            <button type="button" onClick={() => void descargar(informe)} disabled={ocupado}
                              aria-label={`${t.descargarOriginal} · ${informe.nombre}`} className="grid size-11 shrink-0 place-items-center rounded-xl text-accent hover:bg-bg">
                              <Download size={18} aria-hidden />
                            </button>
                            <button type="button" onClick={() => void eliminar(informe)} disabled={ocupado}
                              aria-label={`${t.informesEliminar} · ${informe.nombre}`} className="grid size-11 shrink-0 place-items-center rounded-xl text-danger hover:bg-bg">
                              <Trash2 size={18} aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )
                })
            ) : <Card><Empty>{t.informesSinArchivos}</Empty></Card>}
          </>
        ) : (
          <Card className="p-4">
            <form onSubmit={(e) => void desbloquear(e)} className="space-y-3">
              {existe === false && <p className="text-sm text-muted">{t.informesRequisito}</p>}
              <label className="block text-sm font-semibold">{t.informesContrasenya}
                <input type="password" autoComplete={existe ? 'current-password' : 'new-password'} value={frase} required
                  minLength={existe === false ? 12 : undefined} disabled={ocupado || existe === undefined}
                  onChange={(e) => setFrase(e.target.value)} className={estiloCampo} />
              </label>
              {existe === false && (
                <label className="block text-sm font-semibold">{t.informesConfirmar}
                  <input type="password" autoComplete="new-password" value={confirmacion} minLength={12} required disabled={ocupado}
                    onChange={(e) => setConfirmacion(e.target.value)} className={estiloCampo} />
                </label>
              )}
              <button type="submit" disabled={ocupado || existe === undefined}
                className="accion-coral min-h-11 rounded-xl px-4 font-semibold disabled:opacity-40">
                {existe ? t.informesDaurir : t.informesCrear}
              </button>
            </form>
          </Card>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </>
  )
}
