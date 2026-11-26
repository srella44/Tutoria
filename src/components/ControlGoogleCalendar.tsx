import { useEffect, useState } from 'react'
import type { Registro } from '../data/types'
import { cargarGoogle, estaEnGoogle, googleConfigurado, reflejarCitaGoogle } from '../lib/googleCalendar'
import { useGoogleCalendar } from '../lib/GoogleCalendarProvider'
import { useI18n } from '../lib/i18n'

export function ControlGoogleCalendar({ cita, titulo }: { cita?: Registro; titulo?: string }) {
  const { t } = useI18n()
  const { conexion, conectar, desconectar, revisarError } = useGoogleCalendar()
  const [listo, setListo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [estado, setEstado] = useState('')
  const [marca, setMarca] = useState<{ token: string; id: string; incluida: boolean }>()
  const token = conexion?.token
  const id = cita?.id

  useEffect(() => {
    if (!token || !id) return
    const peticion = new AbortController()
    estaEnGoogle(token, id, peticion.signal).then(
      (incluida) => { if (!peticion.signal.aborted) setMarca({ token, id, incluida }) },
      (error: unknown) => {
        if (peticion.signal.aborted) return
        revisarError(error)
        setEstado(t.googleError)
      },
    )
    return () => peticion.abort()
  }, [id, revisarError, t.googleError, token])

  const marcaActual = marca && marca.token === token && marca.id === id ? marca : undefined

  useEffect(() => {
    if (!googleConfigurado) return
    let activo = true
    cargarGoogle().then(
      () => { if (activo) setListo(true) },
      () => { if (activo) setEstado(t.googleError) },
    )
    return () => { activo = false }
  }, [t.googleError])

  if (!googleConfigurado) return null

  const operar = async (accion: () => Promise<void>, exito = '') => {
    setOcupado(true)
    setEstado('')
    try {
      await accion()
      setEstado(exito)
    } catch (error) {
      revisarError(error)
      setEstado(t.googleError)
    } finally {
      setOcupado(false)
    }
  }

  const sincronizar = (incluir: boolean) => {
    if (!conexion || !cita || !titulo) return
    if (conexion.expira <= Date.now()) {
      desconectar()
      return
    }
    void operar(
      async () => {
        await reflejarCitaGoogle(conexion.token, cita, titulo, incluir)
        setMarca({ token: conexion.token, id: cita.id, incluida: incluir })
      },
      incluir ? t.googleEnviado : t.googleQuitado,
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        {!conexion ? (
          <button disabled={!listo || ocupado} onClick={() => void operar(conectar)} className="min-h-11 rounded-xl bg-accent px-3 text-sm font-semibold text-on-accent disabled:opacity-50">
            {t.googleConectar}
          </button>
        ) : (
          <>
            {cita ? (
              <>
                <label className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold">
                  <input type="checkbox" checked={marcaActual?.incluida ?? false}
                    disabled={!marcaActual || ocupado} onChange={(event) => sincronizar(event.target.checked)}
                    className="size-5 accent-accent" />
                  {t.googleEnviar}
                </label>
                {marcaActual?.incluida && (
                  <button disabled={ocupado} onClick={() => sincronizar(true)} className="min-h-11 rounded-xl border border-line px-3 text-sm disabled:opacity-50">
                    {t.googleActualizar}
                  </button>
                )}
              </>
            ) : (
              <>
                <span className="text-sm font-semibold text-accent">{t.googleConectado}</span>
                <button onClick={() => { desconectar(); setEstado('') }} className="min-h-11 rounded-xl px-3 text-sm hover:bg-bg">
                  {t.googleDesconectar}
                </button>
              </>
            )}
          </>
        )}
      </div>
      {estado && <p role="status" className="mt-2 text-sm text-muted">{estado}</p>}
    </div>
  )
}
