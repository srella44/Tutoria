// Cerradura de la app (Fase 2): crear el PIN, desbloquear, recuperar con la clave y bloqueo automático.
// Mientras está bloqueada, los datos descifrados no existen en memoria: el store ni siquiera se monta.
import { CloudDownload, KeyRound, Lock, ScanFace, ShieldCheck } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { borrarDispositivo, borrarPasskeyServidor, borrarSesion, buscarPasskey, subirPasskey, syncActiva, cifrarTodo, guardarMinutosBloqueo, guardarSesion, leerMinutosBloqueo, leerSesion, tocarSesion, descargarRecuperacion, guardarCandado, leerCandado, llaveDispositivo, prepararDispositivoUnido, sincronizarAhora, usarLlave } from '../data/db'
import { abrirConPin, abrirSesion, cambiarPin as recambiarPin, crearCandado, crearSesion, MAX_INTENTOS, recuperar, type Candado } from '../lib/cripto'
import { useI18n } from '../lib/i18n'
import { abrirConPasskey, passkeyPosible, registrarPasskey } from '../lib/passkey'
import { MarcaTutoria } from './MarcaTutoria'

const pinValido = (pin: string) => /^\d{4,8}$/.test(pin)

interface CerraduraCtx {
  /** false si el navegador no deja guardar: no hay cifrado ni bloqueo. */
  activa: boolean
  bloquear: () => void
  /** Cambia el PIN comprobando el actual. Devuelve false si el actual no es correcto. */
  cambiarPin: (actual: string, nuevo: string) => Promise<boolean>
  /** Minutos sin uso hasta el bloqueo automático. */
  minutos: number
  cambiarMinutos: (minutos: number) => void
  /** Desbloqueo con passkey (Face ID / Windows Hello). */
  biometria: { posible: boolean; activa: boolean; activar: () => Promise<'ok' | 'sin-prf' | 'error'>; desactivar: () => Promise<void> }
}
const sinBiometria = { posible: false, activa: false, activar: async () => 'error' as const, desactivar: async () => {} }
const Ctx = createContext<CerraduraCtx>({ activa: false, bloquear: () => {}, cambiarPin: async () => false, minutos: 5, cambiarMinutos: () => {}, biometria: sinBiometria })
export const useCerradura = () => useContext(Ctx)

type Estado =
  | { fase: 'cargando' }
  | { fase: 'sin-almacenamiento' }
  | { fase: 'crear' }
  | { fase: 'unirse' }
  | { fase: 'clave'; clave: string; dek: CryptoKey }
  | { fase: 'pin'; candado: Candado }
  | { fase: 'recuperar'; candado: Candado }
  | { fase: 'abierta'; dek: CryptoKey }

export function Cerradura({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const ultimaActividad = useRef(Date.now())
  const [minutos, setMinutos] = useState(60)
  const limite = minutos * 60_000

  useEffect(() => {
    (async () => {
      const candado = await leerCandado()
      const mins = await leerMinutosBloqueo()
      setMinutos(mins)
      if (!candado) return setEstado({ fase: 'crear' })
      if (!candado.dekPin) return setEstado({ fase: 'recuperar', candado })
      // Al recargar: si la app se usó hace menos del tiempo de bloqueo, se abre sin pedir el PIN.
      const sesion = await leerSesion()
      if (sesion && Date.now() - sesion.ultima < mins * 60_000) {
        const dek = await abrirSesion(sesion)
        if (dek) {
          usarLlave(dek)
          return setEstado({ fase: 'abierta', dek })
        }
      }
      await borrarSesion()
      setEstado({ fase: 'pin', candado })
    })().catch(() => setEstado({ fase: 'sin-almacenamiento' }))
  }, [])

  const bloquear = useCallback(() => {
    usarLlave(null)
    void borrarSesion()
    leerCandado().then((candado) => candado && setEstado({ fase: 'pin', candado }))
  }, [])

  const cambiarMinutos = (m: number) => {
    setMinutos(m)
    void guardarMinutosBloqueo(m)
  }

  const dekAbierta = estado.fase === 'abierta' ? estado.dek : null

  // Pide almacenamiento persistente: así el navegador no borra los datos por su cuenta cuando le falta espacio.
  useEffect(() => {
    if (dekAbierta) void navigator.storage?.persist?.().catch(() => {})
  }, [dekAbierta])

  // Sesión abierta: se crea al desbloquear y se renueva mientras se usa la app (cada 30 s como mucho).
  useEffect(() => {
    if (!dekAbierta) return
    leerSesion().then(async (s) => {
      if (s) await tocarSesion(Date.now())
      else await guardarSesion(await crearSesion(dekAbierta))
    }).catch(() => {})
  }, [dekAbierta])

  // Bloqueo automático tras el tiempo elegido sin tocar la app (también si estuvo en segundo plano).
  const abierta = estado.fase === 'abierta'
  useEffect(() => {
    if (!abierta) return
    ultimaActividad.current = Date.now()
    let guardada = Date.now()
    const actividad = () => {
      ultimaActividad.current = Date.now()
      if (ultimaActividad.current - guardada > 30_000) {
        guardada = ultimaActividad.current
        void tocarSesion(guardada)
      }
    }
    const comprobar = () => { if (Date.now() - ultimaActividad.current > limite) bloquear() }
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    eventos.forEach((e) => window.addEventListener(e, actividad, { passive: true }))
    document.addEventListener('visibilitychange', comprobar)
    const reloj = window.setInterval(comprobar, 15_000)
    return () => {
      eventos.forEach((e) => window.removeEventListener(e, actividad))
      document.removeEventListener('visibilitychange', comprobar)
      window.clearInterval(reloj)
    }
  }, [abierta, bloquear, limite])

  // Face ID / Windows Hello
  const [passkeyActiva, setPasskeyActiva] = useState(false)
  useEffect(() => {
    if (dekAbierta) leerCandado().then((c) => setPasskeyActiva(Boolean(c?.passkey))).catch(() => {})
  }, [dekAbierta])
  const biometria = {
    posible: passkeyPosible(),
    activa: passkeyActiva,
    activar: async (): Promise<'ok' | 'sin-prf' | 'error'> => {
      if (estado.fase !== 'abierta') return 'error'
      try {
        const env = await registrarPasskey(estado.dek)
        const candado = await leerCandado()
        if (!candado) return 'error'
        await guardarCandado({ ...candado, passkey: env })
        if (await syncActiva()) await subirPasskey(env).catch(() => {})
        setPasskeyActiva(true)
        return 'ok'
      } catch (e) {
        return e instanceof Error && e.message === 'sin-prf' ? 'sin-prf' : 'error'
      }
    },
    desactivar: async () => {
      const candado = await leerCandado()
      if (candado?.passkey) {
        await borrarPasskeyServidor(candado.passkey.id)
        await guardarCandado({ ...candado, passkey: undefined })
      }
      setPasskeyActiva(false)
    },
  }

  const cambiarPin = async (actual: string, nuevo: string) => {
    if (estado.fase !== 'abierta' || !pinValido(nuevo)) return false
    const candado = await leerCandado()
    const dispositivo = await llaveDispositivo()
    if (!candado || !(await abrirConPin(candado, actual, dispositivo))) return false
    await guardarCandado(await recambiarPin(candado, estado.dek, nuevo, dispositivo))
    return true
  }

  if (estado.fase === 'sin-almacenamiento') {
    return <Ctx.Provider value={{ activa: false, bloquear: () => {}, cambiarPin: async () => false, minutos, cambiarMinutos, biometria: sinBiometria }}>{children}</Ctx.Provider>
  }
  if (estado.fase === 'abierta') {
    return <Ctx.Provider value={{ activa: true, bloquear, cambiarPin, minutos, cambiarMinutos, biometria }}>{children}</Ctx.Provider>
  }
  return (
    <div className="pt-safe pb-safe grid min-h-full place-items-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <MarcaTutoria className="mx-auto mb-8 h-10 w-auto text-ink" />
        {estado.fase === 'cargando' && <p className="text-center text-muted">…</p>}
        {estado.fase === 'crear' && (
          <CrearPin onListo={(clave, dek) => setEstado({ fase: 'clave', clave, dek })} onUnirse={() => setEstado({ fase: 'unirse' })} />
        )}
        {estado.fase === 'unirse' && (
          <Unirse onAbierta={(dek) => setEstado({ fase: 'abierta', dek })} onVolver={() => setEstado({ fase: 'crear' })} />
        )}
        {estado.fase === 'clave' && <MostrarClave clave={estado.clave} onContinuar={() => setEstado({ fase: 'abierta', dek: estado.dek })} />}
        {estado.fase === 'pin' && (
          <PedirPin
            candado={estado.candado}
            onAbierta={(dek) => setEstado({ fase: 'abierta', dek })}
            onAgotado={(candado) => setEstado({ fase: 'recuperar', candado })}
            onRecuperar={() => setEstado({ fase: 'recuperar', candado: estado.candado })}
          />
        )}
        {estado.fase === 'recuperar' && (
          <Recuperar
            candado={estado.candado}
            onAbierta={(dek) => setEstado({ fase: 'abierta', dek })}
            onVolver={estado.candado.dekPin ? () => setEstado({ fase: 'pin', candado: estado.candado }) : undefined}
          />
        )}
      </div>
    </div>
  )
}

const claseCampo = 'h-14 w-full rounded-2xl border border-line bg-surface px-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-accent'

function CampoPin({ value, onChange, label, autoFocus }: { value: string; onChange: (v: string) => void; label: string; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        maxLength={8}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className={claseCampo}
      />
    </label>
  )
}

function Boton({ children, ocupado, disabled }: { children: ReactNode; ocupado?: boolean; disabled?: boolean }) {
  return (
    <button type="submit" disabled={disabled || ocupado} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-on-accent disabled:opacity-40">
      {ocupado ? '…' : children}
    </button>
  )
}

function CrearPin({ onListo, onUnirse }: { onListo: (clave: string, dek: CryptoKey) => void; onUnirse: () => void }) {
  const { t } = useI18n()
  // Unir este dispositivo a la cuenta: siempre visible en la app publicada (la vista previa no tiene servidor).
  // Si el servidor no responde, la pantalla de unirse lo explica.
  const hayCuenta = !import.meta.env.VITE_SINGLEFILE
  const [pin, setPin] = useState('')
  const [repetido, setRepetido] = useState('')
  const [error, setError] = useState<string>()
  const [ocupado, setOcupado] = useState(false)
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!pinValido(pin)) return setError(t.pinCorto)
    if (pin !== repetido) return setError(t.pinNoCoincide)
    setOcupado(true)
    const { dek, candado, clave } = await crearCandado(pin, await llaveDispositivo())
    usarLlave(dek)
    await cifrarTodo() // lo que ya hubiera en claro queda cifrado
    await guardarCandado(candado)
    onListo(clave, dek)
  }
  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="text-center">
        <ShieldCheck size={36} className="mx-auto text-accent" aria-hidden />
        <h1 className="mt-2 text-2xl font-bold">{t.crearPin}</h1>
        <p className="mt-1 text-muted">{t.crearPinAyuda}</p>
      </div>
      <CampoPin label={t.pin} value={pin} onChange={setPin} autoFocus />
      <CampoPin label={t.repetirPin} value={repetido} onChange={setRepetido} />
      {error && <p className="text-center text-sm text-danger">{error}</p>}
      <Boton ocupado={ocupado} disabled={!pin || !repetido}>{ocupado ? t.cifrando : t.continuar}</Boton>
      {hayCuenta && (
        <button type="button" onClick={onUnirse} className="flex w-full items-center justify-center gap-2 text-sm text-accent underline">
          <CloudDownload size={16} aria-hidden /> {t.otroDispositivo}
        </button>
      )}
    </form>
  )
}

/** Unir este dispositivo a la cuenta: la clave de recuperación abre la llave guardada (cifrada) en el servidor. */
function Unirse({ onAbierta, onVolver }: { onAbierta: (dek: CryptoKey) => void; onVolver: () => void }) {
  const { t } = useI18n()
  const [clave, setClave] = useState('')
  const [pin, setPin] = useState('')
  const [repetido, setRepetido] = useState('')
  const [error, setError] = useState<string>()
  const [ocupado, setOcupado] = useState(false)
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!pinValido(pin)) return setError(t.pinCorto)
    if (pin !== repetido) return setError(t.pinNoCoincide)
    setOcupado(true)
    setError(undefined)
    try {
      const remota = await descargarRecuperacion()
      if (!remota) throw new Error('sin cuenta')
      const base: Candado = { version: 1, ...remota, saltPin: new Uint8Array(16), ivPin: new Uint8Array(12), ivDispositivo: new Uint8Array(12), intentos: 0 }
      const r = await recuperar(base, clave, pin, await llaveDispositivo())
      if (!r) {
        setError(t.claveIncorrecta)
        setOcupado(false)
        return
      }
      await guardarCandado(r.candado)
      usarLlave(r.dek)
      await prepararDispositivoUnido()
      await sincronizarAhora()
      onAbierta(r.dek)
    } catch {
      setError(t.errorServidor)
      setOcupado(false)
    }
  }
  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="text-center">
        <CloudDownload size={32} className="mx-auto text-accent" aria-hidden />
        <h1 className="mt-2 text-xl font-bold">{t.otroDispositivo}</h1>
        <p className="mt-1 text-muted">{t.unirseAyuda}</p>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-muted">{t.claveRecuperacion}</span>
        <input autoFocus autoCapitalize="characters" autoComplete="off" value={clave} onChange={(e) => setClave(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
          className="h-14 w-full rounded-2xl border border-line bg-surface px-4 text-center font-mono text-lg outline-none focus:border-accent" />
      </label>
      <CampoPin label={t.pinNuevo} value={pin} onChange={setPin} />
      <CampoPin label={t.repetirPin} value={repetido} onChange={setRepetido} />
      {error && <p className="text-center text-sm text-danger">{error}</p>}
      <Boton ocupado={ocupado} disabled={!clave || !pin || !repetido}>{ocupado ? t.descargando : t.continuar}</Boton>
      {passkeyPosible() && (
        <button
          type="button"
          disabled={ocupado || !pin || !repetido}
          onClick={async () => {
            if (!pinValido(pin)) return setError(t.pinCorto)
            if (pin !== repetido) return setError(t.pinNoCoincide)
            setOcupado(true)
            setError(undefined)
            try {
              const remota = await descargarRecuperacion()
              if (!remota) throw new Error('sin cuenta')
              // La passkey (sincronizada por el llavero) abre la llave guardada en el servidor.
              const { dek, envoltorio } = await abrirConPasskey(undefined, buscarPasskey)
              const base: Candado = { version: 1, ...remota, saltPin: new Uint8Array(16), ivPin: new Uint8Array(12), ivDispositivo: new Uint8Array(12), intentos: 0 }
              const candado = await recambiarPin(base, dek, pin, await llaveDispositivo())
              await guardarCandado({ ...candado, passkey: envoltorio })
              usarLlave(dek)
              await prepararDispositivoUnido()
              await sincronizarAhora()
              onAbierta(dek)
            } catch {
              setError(t.biometriaError)
              setOcupado(false)
            }
          }}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent font-semibold text-accent disabled:opacity-40"
        >
          <ScanFace size={20} aria-hidden /> {t.entrarBiometria}
        </button>
      )}
      <button type="button" onClick={onVolver} className="w-full text-center text-sm text-accent underline">{t.volver}</button>
    </form>
  )
}

function MostrarClave({ clave, onContinuar }: { clave: string; onContinuar: () => void }) {
  const { t } = useI18n()
  const [apuntada, setApuntada] = useState(false)
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (apuntada) onContinuar() }} className="space-y-4">
      <div className="text-center">
        <KeyRound size={36} className="mx-auto text-accent" aria-hidden />
        <h1 className="mt-2 text-2xl font-bold">{t.claveRecuperacion}</h1>
        <p className="mt-1 text-muted">{t.claveAyuda}</p>
      </div>
      <p className="rounded-2xl border-2 border-dashed border-accent bg-surface px-3 py-5 text-center font-mono text-xl font-bold tracking-wider select-all">{clave}</p>
      <label className="flex min-h-11 items-center justify-center gap-3">
        <input type="checkbox" checked={apuntada} onChange={(e) => setApuntada(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
        <span>{t.claveApuntada}</span>
      </label>
      <Boton disabled={!apuntada}>{t.continuar}</Boton>
    </form>
  )
}

function PedirPin({ candado, onAbierta, onAgotado, onRecuperar }: {
  candado: Candado
  onAbierta: (dek: CryptoKey) => void
  onAgotado: (c: Candado) => void
  onRecuperar: () => void
}) {
  const { t } = useI18n()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string>()
  const [ocupado, setOcupado] = useState(false)
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setOcupado(true)
    const actual = (await leerCandado()) ?? candado
    const dek = await abrirConPin(actual, pin, await llaveDispositivo())
    if (dek) {
      if (actual.intentos) await guardarCandado({ ...actual, intentos: 0 })
      usarLlave(dek)
      onAbierta(dek)
      return
    }
    const intentos = actual.intentos + 1
    if (intentos >= MAX_INTENTOS) {
      // Demasiados intentos: se borra la copia de la llave protegida por PIN.
      const agotado: Candado = { ...actual, intentos, dekPin: undefined }
      await guardarCandado(agotado)
      onAgotado(agotado)
      return
    }
    await guardarCandado({ ...actual, intentos })
    setError(`${t.pinIncorrecto} ${MAX_INTENTOS - intentos}`)
    setPin('')
    setOcupado(false)
  }
  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="text-center">
        <Lock size={32} className="mx-auto text-accent" aria-hidden />
      </div>
      <CampoPin label={t.pin} value={pin} onChange={setPin} autoFocus />
      {error && <p className="text-center text-sm text-danger">{error}</p>}
      <Boton ocupado={ocupado} disabled={pin.length < 4}>{t.desbloquear}</Boton>
      {candado.passkey && candado.dekPin && (
        <button
          type="button"
          onClick={async () => {
            setError(undefined)
            try {
              const { dek } = await abrirConPasskey(candado.passkey)
              const actual = (await leerCandado()) ?? candado
              if (actual.intentos) await guardarCandado({ ...actual, intentos: 0 })
              usarLlave(dek)
              onAbierta(dek)
            } catch {
              setError(t.biometriaError)
            }
          }}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-accent font-semibold text-accent"
        >
          <ScanFace size={20} aria-hidden /> {t.desbloquearBiometria}
        </button>
      )}
      <button type="button" onClick={onRecuperar} className="w-full text-center text-sm text-accent underline">{t.usarClave}</button>
    </form>
  )
}

function Recuperar({ candado, onAbierta, onVolver }: { candado: Candado; onAbierta: (dek: CryptoKey) => void; onVolver?: () => void }) {
  const { t } = useI18n()
  const [clave, setClave] = useState('')
  const [pin, setPin] = useState('')
  const [repetido, setRepetido] = useState('')
  const [error, setError] = useState<string>()
  const [ocupado, setOcupado] = useState(false)
  const [borrar, setBorrar] = useState(false)
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!pinValido(pin)) return setError(t.pinCorto)
    if (pin !== repetido) return setError(t.pinNoCoincide)
    setOcupado(true)
    const r = await recuperar(candado, clave, pin, await llaveDispositivo())
    if (!r) {
      setError(t.claveIncorrecta)
      setOcupado(false)
      return
    }
    await guardarCandado(r.candado)
    usarLlave(r.dek)
    onAbierta(r.dek)
  }
  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="text-center">
        <KeyRound size={32} className="mx-auto text-accent" aria-hidden />
        {!candado.dekPin && <p className="mt-2 text-warn">{t.bloqueadoIntentos}</p>}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-muted">{t.claveRecuperacion}</span>
        <input
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
          className="h-14 w-full rounded-2xl border border-line bg-surface px-4 text-center font-mono text-lg outline-none focus:border-accent"
        />
      </label>
      <CampoPin label={t.pinNuevo} value={pin} onChange={setPin} />
      <CampoPin label={t.repetirPin} value={repetido} onChange={setRepetido} />
      {error && <p className="text-center text-sm text-danger">{error}</p>}
      <Boton ocupado={ocupado} disabled={!clave || !pin || !repetido}>{t.desbloquear}</Boton>
      {onVolver && <button type="button" onClick={onVolver} className="w-full text-center text-sm text-accent underline">{t.volver}</button>}
      <div className="border-t border-line pt-4 text-center">
        <button
          type="button"
          onClick={async () => {
            if (!borrar) return setBorrar(true)
            await borrarDispositivo()
            window.location.reload()
          }}
          className={`text-sm ${borrar ? 'font-semibold text-danger' : 'text-muted underline'}`}
        >
          {borrar ? `${t.borrarTodoAviso} ${t.tocaConfirmar}` : t.borrarTodo}
        </button>
      </div>
    </form>
  )
}
