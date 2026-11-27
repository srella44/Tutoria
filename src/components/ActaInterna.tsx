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

const coloresPostit = ['amarillo', 'menta', 'lila', 'rosa', 'melocoton'] as const

// Acta interna (Claustre, Cicle, Mentoria, otras): diseño «popurrí» para uso propio.
// Libreta pautada con margen y cinta, puntos y Ahèrs en post-its, notas en bocadillo y sello.
export function ActaInterna({ cita, titulo, fecha, detalle }: { cita: Registro; titulo: string; fecha: string; detalle?: string }) {
  const { t } = useI18n()
  const { ahers, curso } = useStore()
  const tareas = ahers.filter((a) => a.origen?.citaId === cita.id)
  const giro = (i: number) => ({ '--giro': `${[-1.2, 1, -0.6, 0.8, -1][i % 5]}deg` }) as CSSProperties

  return (
    <article className="acta-impresion acta-popurri">
      <Banderines />
      {citaRealizada(cita) && <span className="acta-sello" aria-hidden>OK!</span>}
      <header className="acta-cabecera">
        {curso.logo && <img src={curso.logo} alt="" className="acta-logo" />}
        <div className="min-w-0">
          <h1 className="acta-titulo">{titulo.toLocaleUpperCase()}!</h1>
          <p className="acta-meta capitalize">{[fecha, curso.tutor].filter(Boolean).join(' · ')}</p>
          {detalle && <p className="acta-meta">{detalle}</p>}
        </div>
      </header>

      {cita.puntos?.map((punto, i) => (
        <section key={punto.id} className="acta-postit" data-color={coloresPostit[i % coloresPostit.length]} style={giro(i)}>
          <h3 className="font-semibold">{i + 1}. {punto.texto}</h3>
          {punto.notas?.trim() && <Tira color={coloresPostit[(i + 2) % coloresPostit.length]}>{punto.notas}</Tira>}
        </section>
      ))}

      {cita.texto.trim() && (
        <section className="acta-postit" data-color="amarillo" style={giro(1)}>
          <h3 className="font-semibold">{t.notasGenerales}</h3>
          <Tira color="lila">{cita.texto}</Tira>
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

function Tira({ color, children }: { color: string; children: string }) {
  return (
    <div className="acta-tira">
      <span className="acta-tira-cinta" data-color={color} aria-hidden />
      <p>{children}</p>
    </div>
  )
}

const coloresBanderin = ['#fac775', '#9fe1cb', '#cecbf6', '#f4c0d1', '#f5c4b3']

function Banderines() {
  return (
    <svg className="acta-banderines" viewBox="0 0 300 26" preserveAspectRatio="none" aria-hidden>
      <path d="M0 2 Q150 16 300 2" fill="none" stroke="#888780" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      {Array.from({ length: 12 }, (_, i) => {
        const x0 = 4 + i * 24.5
        const y = (x: number) => 2 + 14 * (1 - (x / 150 - 1) ** 2) / 2
        return <polygon key={i} points={`${x0},${y(x0)} ${x0 + 16},${y(x0 + 16)} ${x0 + 8},${y(x0 + 8) + 13}`} fill={coloresBanderin[i % 5]} />
      })}
    </svg>
  )
}
