import { AherDePunto } from './AherDePunto'
import { Card } from './ui'
import { useStore } from '../data/store'
import type { Registro } from '../data/types'
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
          {(cita.tipo === 'claustro' || cita.tipo === 'ciclo') && (
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

export function ActaInterna({ cita, titulo, fecha }: { cita: Registro; titulo: string; fecha: string }) {
  const { t } = useI18n()

  return (
    <Card className="acta-impresion p-5 sm:p-8">
      <p className="mb-2 text-sm font-semibold text-muted">{t.acta} · Tutoria</p>
      <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
      <p className="mt-1 text-sm text-muted capitalize">{fecha}</p>

      {!!cita.puntos?.length && (
        <section className="mt-6">
          <h2 className="mb-3 font-bold">{t.ordenDia}</h2>
          <ol className="space-y-4">
            {cita.puntos.map((punto, i) => (
              <li key={punto.id} className="acta-punto border-t border-line pt-3">
                <h3 className="font-semibold">{i + 1}. {punto.texto}</h3>
                {punto.notas?.trim() && <p className="mt-1 whitespace-pre-wrap wrap-anywhere">{punto.notas}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {cita.texto.trim() && (
        <section className="mt-6">
          <h2 className="mb-2 font-bold">{t.notasGenerales}</h2>
          <p className="whitespace-pre-wrap wrap-anywhere">{cita.texto}</p>
        </section>
      )}
    </Card>
  )
}
