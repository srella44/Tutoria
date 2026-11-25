import type { Lang } from './i18n'

const dias: Record<Lang, string[]> = {
  oc: ['dimenge', 'diluns', 'dimars', 'dimèrcles', 'dijaus', 'diuendres', 'dissabte'],
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
}

const pad = (n: number) => String(n).padStart(2, '0')

export function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

/** Diferencia en días naturales entre la fecha y hoy (0 = hoy, 1 = mañana, -1 = ayer). */
export function diasDesdeHoy(iso: string) {
  const ms = startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()
  return Math.round(ms / 86_400_000)
}

export function fechaCorta(iso: string, lang: Lang) {
  const d = new Date(iso)
  return `${dias[lang][d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

export function fechaHora(iso: string, lang: Lang) {
  const d = new Date(iso)
  return `${fechaCorta(iso, lang)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function hora(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ahoraLocalIso() {
  return new Date().toISOString()
}
