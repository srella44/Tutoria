import type { Lang } from './i18n'

const dias: Record<Lang, string[]> = {
  oc: ['dimenge', 'diluns', 'dimars', 'dimèrcles', 'dijaus', 'diuendres', 'dissabte'],
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
}

const pad = (n: number) => String(n).padStart(2, '0')

export function diaLocal(fecha: Date | string) {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha
  const d = new Date(fecha)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fechaLocal(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
}

export function startOfDay(d: Date) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

/** Diferencia en días naturales entre la fecha y hoy (0 = hoy, 1 = mañana, -1 = ayer). */
export function diasDesdeHoy(iso: string) {
  const ms = startOfDay(fechaLocal(iso)).getTime() - startOfDay(new Date()).getTime()
  return Math.round(ms / 86_400_000)
}

export function fechaCorta(iso: string, lang: Lang) {
  const d = fechaLocal(iso)
  return `${dias[lang][d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

export function fechaHora(iso: string, lang: Lang) {
  const d = fechaLocal(iso)
  return `${fechaCorta(iso, lang)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function hora(iso: string) {
  const d = fechaLocal(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ahoraLocalIso() {
  return new Date().toISOString()
}

const meses = {
  oc: ['gèr', 'hereuèr', 'març', 'abriu', 'mai', 'junh', 'junhsèga', 'agost', 'seteme', 'octobre', 'noveme', 'deseme'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
}

export function mesYAnyo(fecha: Date, lang: Lang) {
  return `${meses[lang][fecha.getMonth()]} ${fecha.getFullYear()}`
}

export function semanaAbreviada(lang: Lang) {
  return lang === 'oc'
    ? ['Dlu', 'Dma', 'Dmc', 'Dja', 'Diu', 'Dis', 'Dge']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
}
