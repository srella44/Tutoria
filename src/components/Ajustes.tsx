// Botón de ajustes: siempre arriba a la derecha, en todas las secciones y dispositivos.
import { Settings } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../data/store'
import { useI18n } from '../lib/i18n'

export function Ajustes() {
  const { t, toggle } = useI18n()
  const { almacenamiento, modo, reiniciar } = useStore()
  const [open, setOpen] = useState(false)
  const [pendiente, setPendiente] = useState<'demo' | 'propio'>()
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

            <p className="mt-2 border-t border-line px-3 pb-1 pt-3 text-xs font-semibold uppercase text-muted">{t.datos}</p>
            <p className="px-3 text-sm">{modo === 'demo' ? t.modoDemo : t.modoPropio}</p>
            <p className={`px-3 pb-1 text-xs ${almacenamiento === 'guardado' ? 'text-muted' : 'text-danger'}`}>
              {almacenamiento === 'guardado' ? t.guardadoLocal : t.soloMemoria}
            </p>
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
              almacenamiento === 'guardado' && (
                <button
                  onClick={() => setPendiente(modo === 'demo' ? 'propio' : 'demo')}
                  className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-bg"
                >
                  {modo === 'demo' ? t.empezarLimpio : t.volverEjemplo}
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  )
}
