import { AherDePunto } from './AherDePunto'
import { useStore } from '../data/store'
import type { CSSProperties } from 'react'
import { citaRealizada, esClaustre, type Registro } from '../data/types'
import { useI18n } from '../lib/i18n'

export function NotasInternas({ cita }: { cita: Registro }) {
  const { t } = useI18n()
  const { setNotaPuntoCita, setTextoRegistro } = useStore()

  return (
    <div className="space-y-3">
      {cita.puntos?.map((punto, i) => (
        <section key={punto.id} className="acta-punto-boli">
          <h3 className="acta-postit acta-etiqueta-punto font-semibold" data-color={coloresPostit[i % coloresPostit.length]} style={giro(i)}>{i + 1}. {punto.texto}</h3>
          {punto.notas?.trim() && <p className="acta-boli">{punto.notas}</p>}
        </section>
      ))}

      {cita.texto.trim() && (
        <section className="acta-punto-boli">
          <h3 className="acta-postit acta-etiqueta-punto font-semibold" data-color="amarillo" style={giro(1)}>{t.notasGenerales}</h3>
          <p className="acta-boli">{cita.texto}</p>
        </section>
      )}

      {tareas.length > 0 && (
        <>
          <h2 className="acta-seccion">{t.acuerdos}</h2>
          <div className="acta-ahers">
            {tareas.map((a, i) => (
              <div key={a.id} className="acta-postit acta-postit-aher" data-color={coloresPostit[(i + 3) % coloresPostit.length]} style={giro(i + 2)}>
                <p className="font-semibold">{a.completado ? '☑' : '☐'} {a.texto}</p>
                <p className="text-sm">{[a.responsable || t.paraMi, a.fecha && new Date(`${a.fecha.slice(0, 10)}T12:00`).toLocaleDateString('es-ES')].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="acta-pie">Tutoria</p>
    </article>
  )
}
