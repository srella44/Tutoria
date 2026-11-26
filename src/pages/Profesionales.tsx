// Agenda de profesionales (EAP, logopeda, mentor digital…), reutilizables en cualquier amassada.
import { BriefcaseBusiness, ChevronLeft, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormProfesional } from '../components/Formularios'
import { Card, Empty, PageHeader } from '../components/ui'
import { useStore } from '../data/store'
import type { Profesional } from '../data/types'
import { useI18n } from '../lib/i18n'

export function Profesionales() {
  const { t } = useI18n()
  const { profesionales } = useStore()
  const [editando, setEditando] = useState<Profesional | 'nuevo'>()
  const ordenados = [...profesionales].sort((a, b) => a.rol.localeCompare(b.rol) || a.nombre.localeCompare(b.nombre))
  return (
    <>
      <PageHeader
        title={t.profesionales}
        icon={BriefcaseBusiness}
        right={
          <button
            onClick={() => setEditando('nuevo')}
            aria-label={t.profesionalNuevo}
            className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent"
          >
            <Plus size={16} /> <span className="hidden sm:inline">{t.profesionalNuevo}</span>
          </button>
        }
      />
      <div className="mx-auto max-w-3xl px-4 pt-3">
        <Link to="/alumnado" className="mb-3 inline-flex items-center gap-1 text-accent">
          <ChevronLeft size={18} /> {t.alumnado}
        </Link>
        <Card>
          {ordenados.length === 0 ? (
            <Empty>{t.sinRegistros}</Empty>
          ) : (
            <ul>
              {ordenados.map((p) => (
                <li key={p.id} className="border-b border-line last:border-0">
                  <button onClick={() => setEditando(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{p.nombre}</span>
                      <span className="block text-sm text-muted">{[p.rol, p.servicio, p.contacto].filter(Boolean).join(' · ')}</span>
                    </span>
                    <Pencil size={16} className="text-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {editando && <FormProfesional profesional={editando === 'nuevo' ? undefined : editando} onClose={() => setEditando(undefined)} />}
    </>
  )
}
