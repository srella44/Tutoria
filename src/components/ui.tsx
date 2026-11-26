// Componentes base mínimos. En la Fase 1 se sustituyen por shadcn/ui (docs/decisiones/0002).
import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { TipoRegistro, Visibilidad } from '../data/types'
import { Ajustes } from './Ajustes'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('panel-app rounded-2xl border border-line bg-surface', className)}>{children}</div>
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

export function PageHeader({ title, right, icon: Icono, color = 'menta', amplio }: {
  title: ReactNode
  right?: ReactNode
  icon?: LucideIcon
  color?: 'miel' | 'menta' | 'lila' | 'azul' | 'coral'
  amplio?: boolean
}) {
  return (
    <header className="cabecera-app pt-safe sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      <div className={clsx('mx-auto flex min-h-16 items-center justify-between gap-2 px-3 sm:px-6', amplio ? 'max-w-6xl' : 'max-w-3xl')}>
        <div className="flex min-w-0 items-center gap-2.5">
          {Icono && <span className="icono-seccion hidden sm:grid" data-color={color}><Icono size={19} aria-hidden /></span>}
          <h1 className="min-w-0 text-lg font-bold tracking-tight sm:text-2xl">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {right}
          <Ajustes />
        </div>
      </div>
    </header>
  )
}

export function Avatar({ nombre, apellidos, size = 40 }: { nombre: string; apellidos: string; size?: number }) {
  const ini = `${nombre.charAt(0)}${apellidos.charAt(0)}`
  const colores = ['menta', 'lila', 'miel', 'azul', 'coral']
  const color = colores[((nombre.codePointAt(0) ?? 0) + (apellidos.codePointAt(0) ?? 0)) % colores.length]
  return (
    <span
      data-color={color}
      className="avatar-app inline-flex shrink-0 items-center justify-center rounded-2xl font-bold"
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
  reunionEap: 'bg-accent-soft text-accent',
  reunionLogopeda: 'bg-accent-soft text-accent',
  claustro: 'bg-accent-soft text-accent',
  ciclo: 'bg-accent-soft text-accent',
  mentoria: 'bg-accent-soft text-accent',
  otraAmassada: 'bg-accent-soft text-accent',
  otroClaustre: 'bg-accent-soft text-accent',
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
