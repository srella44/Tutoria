// Aviso de versión nueva: la app instalada en el iPhone puede seguir con la copia antigua.
// Se comprueba al volver a la app y cada 30 minutos; el cambio solo se aplica al tocar el aviso,
// para no recargar a mitad de una reunión.
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../lib/i18n'

export function AvisVersion() {
  const { t } = useI18n()
  const { needRefresh: [nova], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      const mirar = () => { registro.update().catch(() => {}) }
      setInterval(mirar, 30 * 60 * 1000)
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') mirar() })
    },
  })
  if (!nova) return null
  return (
    <div role="status" className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+12px)] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lg">
      <span className="flex-1">{t.versionNaua}</span>
      <button onClick={() => void updateServiceWorker(true)} className="min-h-10 rounded-xl bg-white px-3 font-semibold text-ink">{t.actualizarApp}</button>
    </div>
  )
}
