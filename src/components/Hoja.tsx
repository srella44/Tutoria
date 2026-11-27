// Hoja inferior (iPhone) o diálogo centrado (iPad/ordenador) para formularios.
import { X } from 'lucide-react'
import { useEffect, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../lib/i18n'

export function Hoja({ titulo, onClose, onGuardar, puedeGuardar = true, children, pie }: {
  titulo: string
  onClose: () => void
  onGuardar: () => void
  puedeGuardar?: boolean
  children: ReactNode
  /** Acciones secundarias al pie (archivar, borrar…). */
  pie?: ReactNode
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
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center" onClick={onClose}>
      <form
        role="dialog"
        aria-label={titulo}
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[92vh] max-h-[92dvh] w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl bg-surface md:max-w-lg md:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <button type="button" onClick={onClose} className="text-muted" aria-label={t.cancelar}>
            <X size={22} />
          </button>
          <span className="font-semibold">{titulo}</span>
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            {t.guardar}
          </button>
        </div>
        <div className="space-y-4 p-4">{children}</div>
        {/* Guardar también al pie: en el iPhone la barra de arriba puede quedar fuera de la vista al desplazarse. */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          {pie}
          <button
            type="submit"
            disabled={!puedeGuardar}
            className="ml-auto min-h-11 rounded-xl bg-accent px-5 font-semibold text-on-accent disabled:opacity-40"
          >
            {t.guardar}
          </button>
        </div>
      </form>
    </div>,
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
