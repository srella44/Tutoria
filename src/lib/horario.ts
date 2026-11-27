// Utilidades del horario conjunto (sesiones del tutor y de la clase).
import type { SesionHorario } from '../data/types'

export const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Día del horario para una fecha (1 = lunes … 5 = viernes; 0 = fin de semana). */
export function diaHorario(fecha: Date) {
  const d = fecha.getDay()
  return d >= 1 && d <= 5 ? d : 0
}

export function sesionesDelDia(horario: SesionHorario[], dia: number) {
  return horario.filter((s) => s.dia === dia).sort((a, b) => a.inicio.localeCompare(b.inicio) || a.quien.localeCompare(b.quien))
}

/** Lo que hay ahora y lo siguiente que empieza hoy. */
export function ahoraYDespues(horario: SesionHorario[], fecha: Date) {
  const hoy = sesionesDelDia(horario, diaHorario(fecha))
  const m = fecha.getHours() * 60 + fecha.getMinutes()
  const ahora = hoy.filter((s) => minutos(s.inicio) <= m && m < minutos(s.fin))
  const primera = hoy.find((s) => minutos(s.inicio) > m)
  const despues = primera ? hoy.filter((s) => s.inicio === primera.inicio) : []
  return { ahora, despues, hayClase: hoy.length > 0 }
}

/** Color estable por materia (los mismos cinco tonos de las secciones). */
const COLORES = ['menta', 'azul', 'miel', 'lila', 'coral'] as const
export function colorMateria(materia: string) {
  let h = 0
  for (const ch of materia.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORES[h % COLORES.length]
}
