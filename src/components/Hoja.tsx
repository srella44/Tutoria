// Formularios a pantalla completa (iPhone, iPad y ordenador).
import { X } from 'lucide-react'
import { useEffect, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../lib/i18n'

export function Hoja({ titulo, onClose, onGuardar, puedeGuardar = true, children, pie, textoGuardar }: {
  titulo: string
  onClose: () => void
  onGuardar: () => void
  puedeGuardar?: boolean
  children: ReactNode
  /** Acciones secundarias al pie (archivar, borrar…). */
  pie?: ReactNode
  /** Texto del botón principal (por defecto, Enregistrar). */
  textoGuardar?: string
}) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (puedeGuardar) onGuardar()
  }
  // Se monta en <body>: dentro de una cabecera con desenfoque, «fixed» quedaría atrapado en ella.
  // Pantalla completa en todos los dispositivos: sin ventanas flotantes que se recorten o se desplacen.
  return createPortal(
    <form
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onSubmit={enviar}
      className="fixed inset-0 z-40 flex flex-col bg-surface"
    >
      <div className="pt-safe shrink-0 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 pr-4 pl-2">
          <button type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-bg" aria-label={t.cancelar}>
            <X size={22} />
          </button>
          <span className="min-w-0 truncate font-semibold">{titulo}</span>
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            {textoGuardar ?? t.guardar}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-2xl space-y-4 p-4">{children}</div>
      </div>
      {/* Acciones al pie, siempre a la vista. */}
      <div className="pb-safe shrink-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2 px-4 py-3">
          {pie}
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="ml-auto min-h-11 rounded-xl bg-accent px-5 font-semibold text-on-accent disabled:opacity-40"
          >
            {textoGuardar ?? t.guardar}
          </button>
        </div>
      </div>
    </form>,
    document.body,
  )
}

export function Campo({ label, children, ayuda }: { label: string; children: ReactNode; ayuda?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-muted">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-muted">{ayuda}</span>}
    </label>
  )
}

export const claseInput = 'h-11 w-full rounded-xl border border-line bg-bg px-3 text-base outline-none focus:border-accent'
export const claseTextarea = 'w-full rounded-xl border border-line bg-bg p-3 text-base outline-none focus:border-accent'

/** Botón para vaciar una hora opcional (en el iPhone el selector de hora no deja dejarla en blanco). */
export function BotoTreureHora({ onTreure }: { onTreure: () => void }) {
  const { t } = useI18n()
  return (
    <button type="button" onClick={onTreure} aria-label={t.treureHora} title={t.treureHora}
      className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted hover:bg-bg">
      <X size={18} aria-hidden />
    </button>
  )
}

/** Hora opcional con su botón para quitarla. */
export function HoraOpcional({ valor, onCanvi, desactivat }: { valor: string; onCanvi: (v: string) => void; desactivat?: boolean }) {
  const { t } = useI18n()
  return (
    <span className="flex min-w-0 gap-1">
      <input type="time" value={valor} disabled={desactivat} onChange={(e) => onCanvi(e.target.value)} aria-label={t.horaOpcional}
        className={`${claseInput} min-w-0 disabled:opacity-40`} />
      {valor && !desactivat && <BotoTreureHora onTreure={() => onCanvi('')} />}
    </span>
  )
}
