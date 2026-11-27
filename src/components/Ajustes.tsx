// Ajustes: el engranaje (arriba a la derecha en todas las secciones) abre la consola de ajustes,
// una página con apartados: General, Seguretat, Sincronizacion e Donades.
import clsx from 'clsx'
import { BriefcaseBusiness, CalendarRange, ChevronRight, CloudUpload, Database, Download, Globe, KeyRound, Lock, MessageSquareQuote, RefreshCw, Settings, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { OPCIONES_BLOQUEO } from '../data/db'
import { useSincronizacion, useStore } from '../data/store'
import { fechaCorta, hora } from '../lib/fechas'
import { useCerradura } from './Cerradura'
import { Campo, Hoja } from './Hoja'
import { Creditos } from './Creditos'
import { useI18n } from '../lib/i18n'
import { PageHeader } from './ui'

/** Engranaje que lleva a la consola de ajustes. */
export function Ajustes() {
  const { t } = useI18n()
  return (
    <Link to="/ajustes" aria-label={t.ajustes} title={t.ajustes}
      className="ajustes-boton flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface">
      <Settings size={20} />
    </Link>
  )
}

function Apartado({ titulo, icono: Icono, children }: { titulo: string; icono: typeof Settings; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface">
      <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted">
        <Icono size={16} aria-hidden /> {titulo}
      </h2>
      <div className="divide-y divide-line">{children}</div>
    </section>
  )
}

const claseFila = 'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg'

function FilaEnlace({ to, icono: Icono, children }: { to: string; icono: typeof Settings; children: ReactNode }) {
  return (
    <Link to={to} className={claseFila}>
      <Icono size={18} className="shrink-0 text-muted" aria-hidden />
      <span className="flex-1">{children}</span>
      <ChevronRight size={16} className="text-muted" aria-hidden />
    </Link>
  )
}

/** Consola de ajustes (ruta /ajustes). */
export function PaginaAjustes() {
  const { t, lang, toggle } = useI18n()
  const { almacenamiento, modo, reiniciar } = useStore()
  const cerradura = useCerradura()
  const sync = useSincronizacion()
  const [errorActivar, setErrorActivar] = useState<string | false>(false)
  const [borrando, setBorrando] = useState(false)
  const [quitandoEjemplo, setQuitandoEjemplo] = useState(false)
  const [pidiendoPin, setPidiendoPin] = useState(false)
  const [cambiandoPin, setCambiandoPin] = useState(false)

  return (
    <>
      <PageHeader title={t.ajustes} icon={Settings} />
      <div className="mx-auto grid max-w-3xl gap-4 px-4 py-4 md:grid-cols-2 md:items-start">
        <Apartado titulo={t.general} icono={Globe}>
          <div className="flex min-h-12 items-center gap-3 px-4 py-2.5">
            <Globe size={18} className="shrink-0 text-muted" aria-hidden />
            <span className="flex-1">{t.lengua}</span>
            <div className="flex rounded-lg border border-line p-0.5 text-sm">
              {(['oc', 'es'] as const).map((l) => (
                <button key={l} onClick={() => l !== lang && toggle()}
                  className={clsx('rounded-md px-3 py-1', lang === l ? 'bg-accent text-on-accent' : 'text-muted')}>
                  {l === 'oc' ? 'Aranés' : 'Castellano'}
                </button>
              ))}
            </div>
          </div>
          <FilaEnlace to="/cursos" icono={CalendarRange}>{t.cursos}</FilaEnlace>
          <FilaEnlace to="/frases" icono={MessageSquareQuote}>{t.frases}</FilaEnlace>
          <FilaEnlace to="/profesionales" icono={BriefcaseBusiness}>{t.profesionales}</FilaEnlace>
          <FilaEnlace to="/autorizaciones" icono={ShieldCheck}>{t.autorizaciones}</FilaEnlace>
        </Apartado>

        {cerradura.activa && (
          <Apartado titulo={t.seguridad} icono={ShieldCheck}>
            <p className="flex items-center gap-2 px-4 py-2.5 text-sm text-accent">
              <ShieldCheck size={16} aria-hidden /> {t.cifradoActivo}
            </p>
            <label className="flex min-h-12 items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">{t.bloqueoAutomatico}</span>
              <select value={cerradura.minutos} onChange={(e) => cerradura.cambiarMinutos(Number(e.target.value))}
                className="w-32 shrink-0 rounded-lg border border-line bg-bg px-2 py-1.5">
                {OPCIONES_BLOQUEO.map((m) => (
                  <option key={m} value={m}>{m === 60 ? t.hora1 : m === 480 ? t.horas8 : `${m} min`}</option>
                ))}
              </select>
            </label>
            <button onClick={() => setCambiandoPin(true)} className={claseFila}>
              <KeyRound size={18} className="shrink-0 text-muted" aria-hidden /> {t.cambiarPin}
            </button>
            <button onClick={() => cerradura.bloquear()} className={claseFila}>
              <Lock size={18} className="shrink-0 text-muted" aria-hidden /> {t.bloquearAhora}
            </button>
          </Apartado>
        )}

        {sync.disponible && cerradura.activa && (
          <Apartado titulo={t.sincronizacion} icono={RefreshCw}>
            <p className={`px-4 py-2.5 text-sm ${sync.estado === 'error' || errorActivar ? 'text-danger' : 'text-muted'}`}>
              {errorActivar ? errorActivar
                : sync.estado === 'desactivada' ? t.syncDesactivada
                : sync.estado === 'sincronizando' ? t.sincronizando
                : sync.estado === 'error' ? t.syncError
                : `${t.ultimaSync}: ${sync.ultima ? hora(new Date(sync.ultima).toISOString()) : '—'}`}
            </p>
            {sync.estado === 'desactivada' ? (
              <button onClick={() => { setErrorActivar(false); setPidiendoPin(true) }} className={claseFila}>
                <CloudUpload size={18} className="shrink-0 text-muted" aria-hidden /> {t.activarSync}
              </button>
            ) : (
              <button onClick={() => void sync.sincronizar()} disabled={sync.estado === 'sincronizando'} className={`${claseFila} disabled:opacity-50`}>
                <RefreshCw size={18} className="shrink-0 text-muted" aria-hidden /> {t.sincronizarAhora}
              </button>
            )}
            {(sync.estado === 'error' || (sync.estado === 'desactivada' && sync.servidor === 'sin-acceso')) && (
              // Suele ser que la sesión de Cloudflare Access ha caducado: al recargar, Access pide entrar.
              <button onClick={() => window.location.reload()} className={claseFila}>
                <RefreshCw size={18} className="shrink-0 text-muted" aria-hidden /> {t.volverAEntrar}
              </button>
            )}
          </Apartado>
        )}

        <Apartado titulo={t.datos} icono={Database}>
          <p className={`px-4 py-2.5 text-sm ${almacenamiento === 'guardado' ? 'text-muted' : 'text-danger'}`}>
            {almacenamiento === 'guardado' ? t.guardadoLocal : t.soloMemoria}
          </p>
          {cerradura.activa && almacenamiento === 'guardado' && <CopiasSeguridad />}
          {almacenamiento === 'guardado' && modo === 'demo' && (
            // Solo con el ejemplo cargado (vista previa): quitarlo.
            <button onClick={async () => { if (!quitandoEjemplo) return setQuitandoEjemplo(true); await reiniciar('propio') }}
              className={clsx(claseFila, quitandoEjemplo && 'font-semibold text-danger')}>
              <Trash2 size={18} className="shrink-0 text-muted" aria-hidden /> {quitandoEjemplo ? `${t.confirmarBorrado} ${t.tocaConfirmar}` : t.empezarLimpio}
            </button>
          )}
          {cerradura.activa && (
            <button
              onClick={async () => {
                if (!borrando) return setBorrando(true)
                const { borrarDispositivo } = await import('../data/db')
                await borrarDispositivo()
                window.location.reload()
              }}
              className={clsx(claseFila, 'text-danger', borrando && 'font-semibold')}
            >
              <Trash2 size={18} className="shrink-0" aria-hidden /> {borrando ? `${t.borrarTodoAviso} ${t.tocaConfirmar}` : t.borrarEsteDispositivo}
            </button>
          )}
        </Apartado>
        <Creditos />
      </div>

      {pidiendoPin && (
        <PedirPinActivar
          onClose={() => setPidiendoPin(false)}
          onActivar={async (pin) => {
            if (!(await cerradura.verificarPin(pin))) return t.pinIncorrecto.split('.')[0] + '.'
            setPidiendoPin(false)
            try {
              await sync.activar()
            } catch (e) {
              if (e instanceof Error && e.message === 'cuenta-existente') {
                // Ya hay cuenta: este aparato se une a ella (se borran sus datos y se entra con el PIN).
                const { borrarDispositivo } = await import('../data/db')
                await borrarDispositivo()
                window.location.reload()
              } else setErrorActivar(t.syncError)
            }
            return undefined
          }}
        />
      )}
      {cambiandoPin && <CambiarPin onClose={() => setCambiandoPin(false)} />}
    </>
  )
}

function CambiarPin({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { cambiarPin } = useCerradura()
  const [actual, setActual] = useState('')
  const [nuevo, setNuevo] = useState('')
  const [repetido, setRepetido] = useState('')
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string }>()
  const campo = 'h-12 w-full rounded-xl border border-line bg-bg px-3 text-center text-xl tracking-[0.4em] outline-none focus:border-accent'
  const pinInput = (v: string, set: (v: string) => void, autoFocus?: boolean) => (
    <input type="password" inputMode="numeric" autoComplete="off" maxLength={8} autoFocus={autoFocus} value={v}
      onChange={(e) => set(e.target.value.replace(/\D/g, ''))} className={campo} />
  )
  return (
    <Hoja
      titulo={t.cambiarPin}
      onClose={onClose}
      puedeGuardar={actual.length >= 4 && nuevo.length >= 4 && repetido.length >= 4}
      onGuardar={async () => {
        if (!/^\d{4,8}$/.test(nuevo)) return setMensaje({ ok: false, texto: t.pinCorto })
        if (nuevo !== repetido) return setMensaje({ ok: false, texto: t.pinNoCoincide })
        const ok = await cambiarPin(actual, nuevo)
        if (ok) onClose()
        else setMensaje({ ok: false, texto: t.pinIncorrecto.split('.')[0] + '.' })
      }}
    >
      <Campo label={t.pinActual}>{pinInput(actual, setActual, true)}</Campo>
      <Campo label={t.pinNuevo}>{pinInput(nuevo, setNuevo)}</Campo>
      <Campo label={t.repetirPin}>{pinInput(repetido, setRepetido)}</Campo>
      {mensaje && <p className={mensaje.ok ? 'text-accent' : 'text-danger'}>{mensaje.texto}</p>}
    </Hoja>
  )
}

/** Antes de activar la sincronización se pide el PIN: así otro aparato podrá entrar con él. */
function PedirPinActivar({ onClose, onActivar }: { onClose: () => void; onActivar: (pin: string) => Promise<string | undefined> }) {
  const { t } = useI18n()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string>()
  return (
    <Hoja titulo={t.activarSync} onClose={onClose} puedeGuardar={pin.length >= 4} onGuardar={async () => setError(await onActivar(pin))}>
      <Campo label={t.pin}>
        <input type="password" inputMode="numeric" autoComplete="off" maxLength={8} autoFocus value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="h-12 w-full rounded-xl border border-line bg-bg px-3 text-center text-xl tracking-[0.4em] outline-none focus:border-accent" />
      </Campo>
      {error && <p className="text-danger">{error}</p>}
    </Hoja>
  )
}

/** Descargar y restaurar copias de seguridad cifradas (decisión 0013). */
function CopiasSeguridad() {
  const { t, lang } = useI18n()
  const { llave } = useCerradura()
  const { restaurar } = useStore()
  const [ultima, setUltima] = useState<string>()
  const [copia, setCopia] = useState<import('../data/db').CopiaSeguridad>()
  const [datos, setDatos] = useState<import('../data/db').Datos | null>()
  const [error, setError] = useState<string>()
  useEffect(() => { void import('../data/db').then((m) => m.ultimaCopia()).then(setUltima) }, [])

  const descargar = async () => {
    const { crearCopia, leerCandado } = await import('../data/db')
    const candado = await leerCandado()
    if (!candado) return
    const blob = await crearCopia(candado)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tutoria-copia-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    setUltima(new Date().toISOString())
  }

  const elegir = async (archivo?: File) => {
    if (!archivo) return
    const { leerCopia, abrirCopia } = await import('../data/db')
    const c = leerCopia(await archivo.text())
    setError(undefined)
    if (!c) return setError(t.copiaNoValida)
    setCopia(c)
    // Prueba de restauración con la llave de este aparato; si no abre, se pedirá la clave de papel.
    setDatos(llave ? await abrirCopia(c, llave) : null)
  }

  return (
    <>
      <button onClick={() => void descargar()} className={claseFila}>
        <Download size={18} className="shrink-0 text-muted" aria-hidden />
        <span className="flex-1">{t.descargarCopia}{ultima && <span className="block text-xs text-muted">{t.ultimaCopia}: {fechaCorta(ultima, lang)}</span>}</span>
      </button>
      <label className={`${claseFila} cursor-pointer`}>
        <Upload size={18} className="shrink-0 text-muted" aria-hidden /> {t.restaurarCopia}
        <input type="file" accept=".json,application/json" className="sr-only" onChange={(e) => { void elegir(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      {error && <p className="px-4 py-2 text-sm text-danger">{error}</p>}
      {copia && (
        <RestaurarCopia
          copia={copia}
          datos={datos ?? null}
          onDatos={setDatos}
          onClose={() => { setCopia(undefined); setDatos(undefined) }}
          onRestaurar={async (d) => { await restaurar(d) }}
        />
      )}
    </>
  )
}

function RestaurarCopia({ copia, datos, onDatos, onClose, onRestaurar }: {
  copia: import('../data/db').CopiaSeguridad
  datos: import('../data/db').Datos | null
  onDatos: (d: import('../data/db').Datos | null) => void
  onClose: () => void
  onRestaurar: (d: import('../data/db').Datos) => Promise<void>
}) {
  const { t, lang } = useI18n()
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string>()
  const [confirmar, setConfirmar] = useState(false)
  const abrirConClaveDePapel = async () => {
    const { abrirCopia, recuperacionDeCopia } = await import('../data/db')
    const { abrirConClave } = await import('../lib/cripto')
    const r = recuperacionDeCopia(copia)
    const dek = await abrirConClave(r.salt, r.iv, r.dek, clave)
    const d = dek && (await abrirCopia(copia, dek))
    if (!d) return setError(t.claveIncorrecta)
    onDatos(d)
  }
  return (
    <Hoja
      titulo={t.restaurarCopia}
      onClose={onClose}
      puedeGuardar={datos ? true : clave.trim().length > 0}
      onGuardar={async () => {
        if (!datos) return abrirConClaveDePapel()
        if (!confirmar) return setConfirmar(true)
        await onRestaurar(datos)
      }}
    >
      <p className="text-sm text-muted">{t.copiaDe} {fechaCorta(copia.fecha, lang)} · {hora(copia.fecha)}</p>
      {datos ? (
        <>
          <p className="text-accent">{t.copiaOk}</p>
          <p className="text-sm">{t.alumnado}: {datos.alumnos.length} · {t.cronologia}: {datos.registros.length} · {t.contactos}: {datos.contactos.length}</p>
          <p className={`rounded-lg px-3 py-2 text-sm ${confirmar ? 'bg-danger-soft font-semibold text-danger' : 'bg-warn-soft text-warn'}`}>
            {t.copiaAviso} {confirmar && t.tocaConfirmar}
          </p>
        </>
      ) : (
        <Campo label={t.claveRecuperacion} ayuda={t.copiaNecesitaClave}>
          <input autoFocus autoCapitalize="characters" autoComplete="off" value={clave} onChange={(e) => setClave(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
            className="h-12 w-full rounded-xl border border-line bg-bg px-3 text-center font-mono outline-none focus:border-accent" />
        </Campo>
      )}
      {error && <p className="text-danger">{error}</p>}
    </Hoja>
  )
}
