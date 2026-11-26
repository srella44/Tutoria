// Botón de ajustes: siempre arriba a la derecha, en todas las secciones y dispositivos.
import { Settings } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../lib/i18n'

export function Ajustes() {
  const { t, toggle } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.ajustes}
        aria-expanded={open}
        className="ajustes-boton flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface"
      >
        <Settings size={20} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-56 rounded-2xl border border-line bg-surface p-2 text-ink shadow-lg">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase text-muted">{t.ajustes}</p>
            <button
              onClick={() => {
                toggle()
                setOpen(false)
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-bg"
            >
              {t.lengua}: {t.idioma}
            </button>
            <p className="px-3 pb-2 pt-1 text-xs text-muted">{t.prototipo}</p>
          </div>
        </>
      )}
    </div>
  )
}
