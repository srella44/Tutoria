import { Check, Circle } from 'lucide-react'
import { useStore } from '../data/store'
import { citaRealizada, type Registro } from '../data/types'
import { useI18n } from '../lib/i18n'

export function EstadoCita({ cita }: { cita: Registro }) {
  const { t } = useI18n()
  const { toggleCita } = useStore()
  const realizada = citaRealizada(cita)
  const Icono = realizada ? Check : Circle

  return (
    <button
      type="button"
      onClick={() => toggleCita(cita.id)}
      aria-label={realizada ? t.marcarPendiente : t.marcarHecha}
      title={realizada ? t.marcarPendiente : t.marcarHecha}
      data-hecha={realizada}
      className="estado-cita"
    >
      <Icono size={16} aria-hidden />
      {realizada ? t.citaHecha : t.pendiente}
    </button>
  )
}
