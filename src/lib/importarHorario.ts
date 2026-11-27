// Importa un horario en cuadrícula (Word, Excel o CSV), como el que reparte el centro:
// una fila de cabecera con los días; en la primera columna las horas; en cada franja, la primera fila es
// lo que hace la clase y la segunda (si la hay) lo que hace el tutor. Si la segunda está vacía, la sesión es conjunta.
// Una franja con un solo texto (p. ej. «Recreacion» en celdas combinadas) vale para todos los días.
import type { SesionHorario } from '../data/types'
import { leerHojas, normalizar, texto, type Celda } from './importar'
import { leerTablasWord } from './leerWord'

const DIAS: [number, RegExp][] = [
  [1, /^(de?l+uns?|dilluns|lunes|lun|dl|dlu|monday|mon)$/],
  [2, /^(dimars|martes|mar|dm|dma|tuesday|tue)$/],
  [3, /^(dim[eè]rcles|dimecres|mi[eé]rcoles|mie|mi[eé]|dc|dmc|wednesday|wed)$/],
  [4, /^(dijaus|jueves|jue|dj|dja|thursday|thu)$/],
  [5, /^(diu?e?ndres|divendres|viernes|vie|dv|diu|friday|fri)$/],
]

const diaDe = (v: Celda) => {
  const s = normalizar(v).replace(/[.:]/g, '')
  return DIAS.find(([, re]) => re.test(s))?.[0]
}

/** Horas que aparecen en una celda («09:00 10:00», «9.00-10.00», o una hora de Excel). */
function horas(v: Celda): string[] {
  if (v instanceof Date) return [`${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}`]
  if (typeof v === 'number' && v > 0 && v < 1) {
    const m = Math.round(v * 24 * 60)
    return [`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`]
  }
  return [...texto(v).matchAll(/\b(\d{1,2})[:.h](\d{2})\b/g)]
    .map(([, h, m]) => `${h.padStart(2, '0')}:${m}`)
    .filter((x) => Number(x.slice(0, 2)) < 24)
}

export interface LecturaHorario {
  hoja: string
  sesiones: Omit<SesionHorario, 'id' | 'cursoId'>[]
}

export function interpretarHorario(filas: Celda[][]): Omit<SesionHorario, 'id' | 'cursoId'>[] | null {
  // Cabecera: la primera fila con al menos tres días.
  const iCab = filas.findIndex((f) => f.filter((c) => diaDe(c)).length >= 3)
  if (iCab < 0) return null
  const columnas = filas[iCab].map((c, col) => ({ col, dia: diaDe(c) })).filter((x): x is { col: number; dia: number } => !!x.dia)
  const colHora = Math.max(0, columnas[0].col - 1)

  // Franjas: empiezan en una fila con hora; una franja está completa cuando ya tiene inicio y fin.
  const franjas: { horas: string[]; filas: Celda[][] }[] = []
  for (const fila of filas.slice(iCab + 1)) {
    const hs = horas(fila[colHora] ?? null)
    const actual = franjas.at(-1)
    if (hs.length && (!actual || actual.horas.length >= 2)) franjas.push({ horas: hs, filas: [fila] })
    else if (actual) {
      actual.horas.push(...hs)
      actual.filas.push(fila)
    }
  }

  const sesiones: Omit<SesionHorario, 'id' | 'cursoId'>[] = []
  for (const { horas: hs, filas: fs } of franjas) {
    if (hs.length < 2 || hs[1] <= hs[0]) continue
    const [inicio, fin] = hs
    const conTexto = fs.filter((f) => columnas.some(({ col }) => texto(f[col] ?? null)))
    if (!conTexto.length) continue
    const celdas = (f: Celda[]) => columnas.map(({ col }) => texto(f[col] ?? null))
    const clase = celdas(conTexto[0])
    // Un solo texto en toda la fila (celdas combinadas): para toda la semana.
    if (conTexto.length === 1 && clase.filter(Boolean).length === 1) {
      const materia = clase.find(Boolean)!
      for (const { dia } of columnas) sesiones.push({ dia, inicio, fin, materia, quien: 'conjunta' })
      continue
    }
    const mio = conTexto[1] ? celdas(conTexto[1]) : []
    columnas.forEach(({ dia }, i) => {
      const c = clase[i]
      const m = mio[i]
      if (c && !m) sesiones.push({ dia, inicio, fin, materia: c, quien: 'conjunta' })
      if (c && m) sesiones.push({ dia, inicio, fin, materia: c, quien: 'clase' })
      if (m) sesiones.push({ dia, inicio, fin, materia: m, quien: 'mia' })
    })
  }
  return sesiones.length ? sesiones : null
}

export async function leerHorario(archivo: File): Promise<LecturaHorario> {
  const esWord = /\.docx$/i.test(archivo.name)
  for (const { hoja, filas } of esWord ? await leerTablasWord(archivo) : await leerHojas(archivo)) {
    const sesiones = interpretarHorario(filas)
    if (sesiones) return { hoja, sesiones }
  }
  throw new Error('sin-horario')
}
