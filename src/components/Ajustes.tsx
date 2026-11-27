// Botón de ajustes: siempre arriba a la derecha, en todas las secciones y dispositivos.
import { CalendarRange, CloudUpload, KeyRound, Lock, MessageSquareQuote, RefreshCw, ScanFace, Settings, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { conEjemplo, OPCIONES_BLOQUEO } from '../data/db'
import { useSincronizacion, useStore } from '../data/store'
import { hora } from '../lib/fechas'
import { useCerradura } from './Cerradura'
import { Campo, Hoja } from './Hoja'
import { useI18n } from '../lib/i18n'

export function Ajustes() {
  const { t, toggle } = useI18n()
  const { almacenamiento, modo, reiniciar } = useStore()
  const [open, setOpen] = useState(false)
  const [pendiente, setPendiente] = useState<'demo' | 'propio'>()
  const cerradura = useCerradura()
  const sync = useSincronizacion()
  const [errorActivar, setErrorActivar] = useState<string | false>(false)
  const [borrando, setBorrando] = useState(false)
  const [uniendo, setUniendo] = useState(false)
  const [avisoBiometria, setAvisoBiometria] = useState<string>()
  const [cambiandoPin, setCambiandoPin] = useState(false)
  const cerrar = () => {
    setOpen(false)
    setPendiente(undefined)
  }
  return (
    <div className="relative">
      <button
        onClick={() => (open ? cerrar() : setOpen(true))}
        aria-label={t.ajustes}
        aria-expanded={open}
        className="ajustes-boton flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface"
      >
        <Settings size={20} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={cerrar} />
          <div className="absolute right-0 z-40 mt-1 w-72 rounded-2xl border border-line bg-surface p-2 text-ink shadow-lg">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-muted">{t.ajustes}</p>
            <button
              onClick={() => {
                toggle()
                cerrar()
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-bg"
            >
              {t.lengua}: {t.idioma}
            </button>
            <Link to="/cursos" onClick={cerrar} className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-bg">
              <CalendarRange size={16} className="text-muted" aria-hidden /> {t.cursos}
            </Link>
            <Link to="/frases" onClick={cerrar} className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-bg">
              <MessageSquareQuote size={16} className="text-muted" aria-hidden /> {t.frases}
            </Link>

            {cerradura.activa && (
              <>
                <p className="mt-2 flex items-center gap-1.5 border-t border-line px-3 pt-3 text-xs text-accent">
                  <ShieldCheck size={14} aria-hidden /> {t.cifradoActivo}
                </p>
                <label className="flex min-h-11 items-center justify-between gap-2 px-3 text-sm">
                  <span>{t.bloqueoAutomatico}</span>
                  <select
                    value={cerradura.minutos}
                    onChange={(e) => cerradura.cambiarMinutos(Number(e.target.value))}
                    className="rounded-lg border border-line bg-bg px-2 py-1.5"
                  >
                    {OPCIONES_BLOQUEO.map((m) => (
                      <option key={m} value={m}>{m === 60 ? t.hora1 : m === 480 ? t.horas8 : `${m} min`}</option>
                    ))}
                  </select>
                </label>
                <button onClick={() => { cerrar(); cerradura.bloquear() }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-bg">
                  <Lock size={16} className="text-muted" aria-hidden /> {t.bloquearAhora}
                </button>
                {cerradura.biometria.posible && (
                  <button
                    onClick={async () => {
                      setAvisoBiometria(undefined)
                      if (cerradura.biometria.activa) return cerradura.biometria.desactivar()
                      const r = await cerradura.biometria.activar()
                      if (r !== 'ok') setAvisoBiometria(r === 'sin-prf' ? t.biometriaNoDisponible : t.biometriaError)
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-bg"
                  >
                    <ScanFace size={16} className="text-muted" aria-hidden />
                    {cerradura.biometria.activa ? t.desactivarBiometria : t.activarBiometria}
                  </button>
                )}
                {cerradura.biometria.activa && <p className="px-3 pb-1 text-xs text-accent">{t.biometriaActiva}</p>}
                {avisoBiometria && <p className="px-3 pb-1 text-xs text-danger">{avisoBiometria}</p>}
                <button onClick={() => setCambiandoPin(true)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-bg">
                  <KeyRound size={16} className="text-muted" aria-hidden /> {t.cambiarPin}
                </button>
              </>
            )}
            {sync.disponible && cerradura.activa && (
              <>
                <p className="mt-2 border-t border-line px-3 pb-1 pt-3 text-xs font-semibold uppercase text-muted">{t.sincronizacion}</p>
                {sync.estado === 'desactivada' && sync.servidor === 'cuenta' ? (
                  // Ya hay cuenta: este dispositivo tiene otra llave y debe unirse (se borran sus datos locales).
                  <>
                    <p className="px-3 pb-1 text-xs text-muted">{t.hayCuenta}</p>
                    <button
                      onClick={async () => {
                        if (!uniendo) return setUniendo(true)
                        const { borrarDispositivo } = await import('../data/db')
                        await borrarDispositivo()
                        window.location.reload()
                      }}
                      className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-bg ${uniendo ? 'font-semibold text-danger' : ''}`}
                    >
                      <CloudUpload size={16} className="text-muted" aria-hidden /> {uniendo ? t.tocaConfirmar : t.unirEsteDispositivo}
                    </button>
                  </>
                ) : sync.estado === 'desactivada' && sync.servidor === 'sin-acceso' ? (
                  <>
                    <p className="px-3 pb-1 text-xs text-danger">{t.sinAcceso}</p>
                    <button onClick={() => window.location.reload()} className="mx-3 mb-1 min-h-9 rounded-lg border border-line px-3 text-sm">
                      {t.volverAEntrar}
                    </button>
                  </>
                ) : (
                  <>
                    <p className={`px-3 text-xs ${sync.estado === 'error' || errorActivar ? 'text-danger' : 'text-muted'}`}>
                      {sync.estado === 'desactivada' ? t.syncDesactivada
                        : sync.estado === 'sincronizando' ? t.sincronizando
                        : sync.estado === 'error' ? t.syncError
                        : `${t.ultimaSync}: ${sync.ultima ? hora(new Date(sync.ultima).toISOString()) : '—'}`}
                    </p>
                    {sync.estado === 'desactivada' ? (
                      <button
                        onClick={async () => {
                          setErrorActivar(false)
                          try { await sync.activar() } catch (e) { setErrorActivar(e instanceof Error && e.message === 'cuenta-existente' ? t.hayCuenta : t.syncError) }
                        }}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-bg"
                      >
                        <CloudUpload size={16} className="text-muted" aria-hidden /> {t.activarSync}
                      </button>
                    ) : (
                      <button onClick={() => void sync.sincronizar()} disabled={sync.estado === 'sincronizando'} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left hover:bg-bg disabled:opacity-50">
                        <RefreshCw size={16} className="text-muted" aria-hidden /> {t.sincronizarAhora}
                      </button>
                    )}
                    {errorActivar && <p className="px-3 pb-1 text-xs text-danger">{errorActivar}</p>}
                    {(sync.estado === 'error' || errorActivar) && (
                      // Suele ser que la sesión de Cloudflare Access ha caducado: al recargar, Access pide entrar.
                      <button onClick={() => window.location.reload()} className="mx-3 mb-1 min-h-9 rounded-lg border border-line px-3 text-sm">
                        {t.volverAEntrar}
                      </button>
                    )}
                  </>
                )}
                <p className="px-3 pb-1 text-[11px] text-muted">{t.syncAyuda}</p>
              </>
            )}
            <p className="mt-2 border-t border-line px-3 pb-1 pt-3 text-xs font-semibold uppercase text-muted">{t.datos}</p>
            {conEjemplo && <p className="px-3 text-sm">{modo === 'demo' ? t.modoDemo : t.modoPropio}</p>}
            <p className={`px-3 pb-1 text-xs ${almacenamiento === 'guardado' ? 'text-muted' : 'text-danger'}`}>
              {almacenamiento === 'guardado' ? t.guardadoLocal : t.soloMemoria}
            </p>
            {cerradura.activa && (
              <button
                onClick={async () => {
                  if (!borrando) return setBorrando(true)
                  const { borrarDispositivo } = await import('../data/db')
                  await borrarDispositivo()
                  window.location.reload()
                }}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-bg ${borrando ? 'font-semibold text-danger' : 'text-muted'}`}
              >
                {borrando ? `${t.borrarTodoAviso} ${t.tocaConfirmar}` : t.borrarEsteDispositivo}
              </button>
            )}
            {pendiente ? (
              <div className="m-1 rounded-xl bg-danger-soft p-3 text-sm">
                <p className="text-danger">{t.confirmarBorrado}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setPendiente(undefined)} className="min-h-10 flex-1 rounded-lg border border-line bg-surface">
                    {t.cancelar}
                  </button>
                  <button
                    onClick={async () => {
                      await reiniciar(pendiente)
                      cerrar()
                    }}
                    className="min-h-10 flex-1 rounded-lg bg-danger font-semibold text-white"
                  >
                    {t.confirmar}
                  </button>
                </div>
              </div>
            ) : (
              // Solo con el ejemplo cargado (vista previa): quitarlo. Volver a cargarlo ya no existe.
              almacenamiento === 'guardado' && modo === 'demo' && (
                <button onClick={() => setPendiente('propio')} className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-bg">
                  {t.empezarLimpio}
                </button>
              )
            )}
          </div>
        </>
      )}
      {cambiandoPin && <CambiarPin onClose={() => { setCambiandoPin(false); cerrar() }} />}
    </div>
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
