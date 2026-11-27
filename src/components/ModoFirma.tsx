// Modo firma: el iPad se entrega a la familia o al alumno. Solo se ven el acta y las casillas de firma;
// para volver a la app hace falta el PIN de TUTOR-ia.
import { Lock } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../lib/i18n'
import { useCerradura } from './Cerradura'

export function ModoFirma({ titulo, children, onSalir }: { titulo: string; children: ReactNode; onSalir: () => void }) {
  const { t } = useI18n()
  const { verificarPin, activa } = useCerradura()
  const [pidiendo, setPidiendo] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  // Mientras dura, el botón «atrás» del navegador no saca del modo firma.
  useEffect(() => {
    history.pushState({ modoFirma: true }, '')
    const volver = () => history.pushState({ modoFirma: true }, '')
    window.addEventListener('popstate', volver)
    return () => window.removeEventListener('popstate', volver)
  }, [])

  const salir = async () => {
    if (!activa || await verificarPin(pin)) onSalir()
    else {
      setError(true)
      setPin('')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={t.modoFirma}>
      <header className="pt-safe shrink-0 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-accent"><Lock size={18} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{titulo}</div>
            <div className="truncate text-xs text-muted">{t.modoFirmaAyuda}</div>
          </div>
          <button type="button" onClick={() => setPidiendo(true)} className="min-h-11 rounded-xl border border-line px-3 text-sm font-semibold">
            {t.salirModoFirma}
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-3xl space-y-4 p-4">{children}</div>
      </div>
      {pidiendo && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); void salir() }}
            className="w-full max-w-sm space-y-3 rounded-3xl bg-surface p-5 text-center"
          >
            <Lock size={28} className="mx-auto text-accent" aria-hidden />
            <p className="font-semibold">{t.pinParaSalir}</p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(false) }}
              className="h-12 w-full rounded-xl border border-line bg-bg px-3 text-center text-xl tracking-[0.4em] outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-danger">{t.pinIncorrecto.split('.')[0]}.</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPidiendo(false); setPin(''); setError(false) }} className="min-h-11 flex-1 rounded-xl border border-line">{t.cancelar}</button>
              <button type="submit" disabled={pin.length < 4} className="min-h-11 flex-1 rounded-xl bg-accent font-semibold text-on-accent disabled:opacity-40">{t.desbloquear}</button>
            </div>
          </form>
        </div>
      )}
    </div>,
    document.body,
  )
}
