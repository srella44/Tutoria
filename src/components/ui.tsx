// Componentes base mínimos. En la Fase 1 se sustituyen por shadcn/ui (docs/decisiones/0002).
import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { TipoRegistro, Visibilidad } from '../data/types'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-line bg-surface', className)}>{children}</div>
  )
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="mb-2 mt-6 flex items-center gap-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">{count}</span>
      )}
    </h2>
  )
}

export function PageHeader({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <header className="pt-safe sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function Avatar({ nombre, apellidos, size = 40 }: { nombre: string; apellidos: string; size?: number }) {
  const ini = `${nombre[0]}${apellidos[0]}`
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {ini}
    </span>
  )
}

const tipoColor: Record<TipoRegistro, string> = {
  observacion: 'bg-accent-soft text-accent',
  incidencia: 'bg-warn-soft text-warn',
  comunicacion: 'bg-line text-ink',
  reunionFamilia: 'bg-accent-soft text-accent',
  reunionProfesionales: 'bg-accent-soft text-accent',
  teEscoti: 'bg-danger-soft text-danger',
  evaluacion: 'bg-line text-ink',
  informe: 'bg-line text-ink',
}

export function TipoChip({ tipo, label }: { tipo: TipoRegistro; label: string }) {
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', tipoColor[tipo])}>{label}</span>
  )
}

export function VisChip({ vis, labels }: { vis: Visibilidad; labels: { protegido: string; reservado: string } }) {
  if (vis === 'normal') return null
  return (
    <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
      {vis === 'protegido' ? labels.protegido : labels.reservado}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-3 text-sm text-muted">{children}</p>
}
