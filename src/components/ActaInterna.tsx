import { AherDePunto } from './AherDePunto'
import { useStore } from '../data/store'
import { citaRealizada, esClaustre, type Registro } from '../data/types'
import { useI18n } from '../lib/i18n'

export function NotasInternas({ cita }: { cita: Registro }) {
  const { t } = useI18n()
  const { setNotaPuntoCita, setTextoRegistro } = useStore()

  return (
    <div className="space-y-3">
      {cita.puntos?.map((punto, i) => (
        <details key={punto.id} open className="panel-app rounded-2xl border border-line bg-surface">
          <summary className="cursor-pointer px-4 py-3 font-semibold">{i + 1}. {punto.texto}</summary>
          <label className="block px-4 pb-4 text-sm text-muted">
            {t.notasPunto}
            <textarea value={punto.notas ?? ''} onChange={(e) => setNotaPuntoCita(cita.id, punto.id, e.target.value)}
              rows={4} className="mt-2 block w-full rounded-xl border border-line bg-bg p-3 text-base text-ink" />
          </label>
          {(cita.tipo === 'claustro' || cita.tipo === 'ciclo' || !esClaustre(cita.tipo)) && (
            <AherDePunto citaId={cita.id} puntoId={punto.id} asunto={punto.texto} />
          )}
        </details>
      ))}
      <details className="panel-app rounded-2xl border border-line bg-surface">
        <summary className="cursor-pointer px-4 py-3 font-semibold">{t.notasGenerales}</summary>
        <div className="px-4 pb-4">
          <textarea aria-label={t.notasGenerales} value={cita.texto} onChange={(e) => setTextoRegistro(cita.id, e.target.value)}
            rows={4} className="block w-full rounded-xl border border-line bg-bg p-3 text-base" />
        </div>
      </details>
    </div>
  )
}


// Acta interna (Claustre, Cicle, Mentoria, otras): diseño «popurrí» para uso propio.
// Libreta pautada con margen y cinta, puntos y Ahèrs en post-its, notas en bocadillo y sello.
export function ActaInterna({ cita, titulo, etiquetas, detalle }: { cita: Registro; titulo: string; etiquetas: string[]; detalle: string[] }) {
  const { t } = useI18n()
  const { ahers, curso } = useStore()
  const tareas = ahers.filter((a) => a.origen?.citaId === cita.id)

  return (
    <article className="acta-impresion acta-popurri">
      {citaRealizada(cita) && <span className="acta-sello" aria-hidden>OK!</span>}
      <span className="acta-cinta" aria-hidden />
      <header className="acta-cabecera">
        {curso.logo && <img src={curso.logo} alt="" className="acta-logo" />}
        <div className="min-w-0">
          <h1 className="acta-titulo"><span className="acta-dymo">{titulo.toLocaleUpperCase()}!</span></h1>
          <p className="acta-etiquetas">
            {etiquetas.map((e, i) => <span key={i} className="acta-dymo acta-dymo-mini" data-color={i % 3}>{e.toLocaleUpperCase()}</span>)}
          </p>
          {detalle.map((d) => <p key={d} className="acta-meta">{d}</p>)}
        </div>
      </header>

      {cita.puntos?.map((punto, i) => (
        <section key={punto.id} className="acta-punto-boli">
          <h3 className="acta-punto-titulo">{i + 1}. {punto.texto}</h3>
          {punto.notas?.trim() && <p className="acta-boli">{punto.notas}</p>}
        </section>
      ))}

      {cita.texto.trim() && (
        <section className="acta-punto-boli">
          <h3 className="acta-punto-titulo">{t.notasGenerales}</h3>
          <p className="acta-boli">{cita.texto}</p>
        </section>
      )}

      {tareas.length > 0 && (
        <>
          <h2 className="acta-seccion">{t.acuerdos}</h2>
          <ul className="acta-ahers">
            {tareas.map((a) => (
              <li key={a.id}>
                <span className="acta-casilla" aria-hidden>{a.completado ? '✓' : ''}</span>
                <span className="font-semibold">{a.texto}</span>
                <span className="acta-meta-inline"> · {[a.responsable || t.paraMi, a.fecha && new Date(`${a.fecha.slice(0, 10)}T12:00`).toLocaleDateString('es-ES')].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="acta-pie">Tutoria</p>
    </article>
  )
}
