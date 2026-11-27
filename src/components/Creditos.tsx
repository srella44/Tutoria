// Pie con la autoría: «Desvolopat per» y el logo de Prètzhèt Digitau, con la versión de la app.
import clsx from 'clsx'
import { useI18n } from '../lib/i18n'

export function Creditos({ className }: { className?: string }) {
  const { t } = useI18n()
  return (
    <footer className={clsx('flex flex-col items-center gap-2 py-6 text-center', className)}>
      <div className="flex items-center gap-2 px-3 py-1">
        <span className="text-sm font-semibold text-ink">{t.desarrolladoPor}</span>
        <span className="h-14 w-0.5 rounded-full bg-accent/40" aria-hidden />
        {/* Animación del láser (del GIF original, con fondo transparente). */}
        <img src="/pretzhet-digitau.webp" alt="Prètzhèt Digitau" width={452} height={202} className="h-20 w-auto" loading="lazy" />
      </div>
      <p className="text-xs text-muted">
        TUTOR-ia · v{__VERSION__} · © {new Date().getFullYear()} Prètzhèt Digitau
      </p>
    </footer>
  )
}
