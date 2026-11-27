// Interpreta cualquier Excel/CSV de autorizaciones. Todo ocurre en el navegador.
// 1) La columna de nombres es la que más coincide con el alumnado de la app (en cualquier hoja y fila).
// 2) Son autorizaciones las columnas cuyo contenido se entiende como sí / no / a viatges (✓, X, Òc, Non, Tostemp…).
// 3) Cada columna se empareja por nombre con una autorización existente o se propone crearla.
import type { Alumno, EstadoAutorizacion, TipoAutorizacion } from '../data/types'
import { leerHojas, normalizar, texto, type Celda } from './importar'

type Lectura = EstadoAutorizacion | 'tostemp' | 'vacio' | null // null = no se entiende

/** Interpreta una celda. 'tostemp' es un «sí» de las autorizaciones de tres opciones. */
export function interpretar(v: Celda): Lectura {
  if (v === true) return 'si'
  if (v === false) return 'no'
  const s = normalizar(v).replace(/[.!]/g, '')
  if (s === '' || /^(-|—|–|n\/?a|pendent|pendiente|\?)$/.test(s)) return 'vacio'
  if (/^(✓|✔|☑|✅|x|si|sí|oc|òc|yes|y|s|ok|1|fet|hecho|autoritzat|autorizado|autorizada|autorizat|vale)$/.test(s)) return 'si'
  if (/^(tostemp|tostemps|sempre|siempre|always|cada dia|tots es dies)$/.test(s)) return 'tostemp'
  if (/^(a viatges|aviatges|a vegades|a veces|aveces|algunos dias|alguns dies|depen|depende|a voltes)$/.test(s)) return 'aviatges'
  if (/^(no|non|n|✗|✘|❌|0|denegat|denegado|no autoritzat|no autorizado)$/.test(s)) return 'no'
  return null
}

const palabras = (s: string) => normalizar(s).replace(/[^a-z0-9ñç ]/g, ' ').split(' ').filter(Boolean)

/** Busca el alumno de un nombre escrito de cualquier forma («Nombre Apellidos», «Apellidos, Nombre»…). */
export function emparejarAlumno(nombre: string, alumnos: Alumno[]): Alumno | undefined {
  const p = palabras(nombre)
  if (p.length === 0) return undefined
  const clave = [...p].sort().join(' ')
  const exacto = alumnos.filter((a) => [...palabras(`${a.nombre} ${a.apellidos}`)].sort().join(' ') === clave)
  if (exacto.length === 1) return exacto[0]
  // Con menos palabras (p. ej. sin segundo apellido): todas las del Excel están en el alumno, y es el único.
  if (p.length >= 2) {
    const contiene = alumnos.filter((a) => { const q = palabras(`${a.nombre} ${a.apellidos}`); return p.every((x) => q.includes(x)) })
    if (contiene.length === 1) return contiene[0]
  }
  return undefined
}

export interface ColumnaAutorizacion {
  indice: number
  cabecera: string
  tresEstados: boolean
  /** id de una autorización existente, 'nueva' o 'ignorar' */
  destino: string
  cuenta: Record<EstadoAutorizacion | 'vacio', number>
}

export interface LecturaAutorizaciones {
  hoja: string
  columnaNombre: string
  columnas: ColumnaAutorizacion[]
  filas: { fila: number; nombre: string; alumno?: Alumno; celdas: Celda[] }[]
}

export async function leerAutorizaciones(archivo: File, alumnos: Alumno[], tipos: TipoAutorizacion[]): Promise<LecturaAutorizaciones> {
  const hojas = await leerHojas(archivo)
  // Hoja y columna de nombres: las que más alumnos reconocen.
  let mejor: { h: number; col: number; aciertos: number } | undefined
  hojas.forEach(({ filas }, h) => {
    const ancho = Math.max(0, ...filas.map((f) => f.length))
    for (let col = 0; col < ancho; col++) {
      const aciertos = filas.filter((f) => emparejarAlumno(texto(f[col] ?? null), alumnos)).length
      if (aciertos > (mejor?.aciertos ?? 0)) mejor = { h, col, aciertos }
    }
  })
  if (!mejor) throw new Error('sin-alumnos')
  const { hoja, filas } = hojas[mejor.h]
  const col = mejor.col
  const primera = filas.findIndex((f) => emparejarAlumno(texto(f[col] ?? null), alumnos))
  // Cabecera: la fila no vacía más cercana por encima de la primera fila con alumno.
  let iCab = primera - 1
  while (iCab >= 0 && !filas[iCab].some((c) => texto(c))) iCab--
  const cabeceras = iCab >= 0 ? filas[iCab] : []
  // Datos: desde la primera fila con alumno; se cortan las filas finales sin nombre reconocible.
  const datos = filas.slice(primera).map((celdas, k) => ({ fila: primera + k + 1, nombre: texto(celdas[col] ?? null), celdas }))
    .filter((d) => d.nombre && !/^(sin datos|sense donades|total)/i.test(d.nombre))
    .map((d) => ({ ...d, alumno: emparejarAlumno(d.nombre, alumnos) }))

  const ancho = Math.max(0, ...datos.map((d) => d.celdas.length))
  const columnas: ColumnaAutorizacion[] = []
  for (let i = 0; i < ancho; i++) {
    if (i === col) continue
    const lecturas = datos.map((d) => interpretar(d.celdas[i] ?? null))
    const llenas = lecturas.filter((l) => l !== 'vacio')
    // Autorización: la mayoría de las celdas con contenido se entienden, y hay alguna.
    if (llenas.length === 0 || llenas.filter((l) => l !== null).length / llenas.length < 0.8) continue
    // Una columna solo de números seguidos (Nº de lista) no es una autorización.
    if (datos.every((d) => /^\d*$/.test(texto(d.celdas[i] ?? null))) && llenas.length > 2) continue
    const cabecera = texto(cabeceras[i] ?? null) || `Columna ${i + 1}`
    const tresEstados = lecturas.some((l) => l === 'tostemp' || l === 'aviatges')
    const cuenta = { si: 0, aviatges: 0, no: 0, vacio: 0 }
    lecturas.forEach((l) => { cuenta[l === 'tostemp' ? 'si' : l ?? 'vacio']++ })
    const n = normalizar(cabecera).replace(/[^a-z0-9]/g, '')
    const alias: Record<string, string[]> = { foto: ['foto', 'fotos', 'imatge', 'imagen', 'imatges', 'imagenes'] }
    const existente = tipos.find((t) => {
      const m = normalizar(t.nombre).replace(/[^a-z0-9]/g, '')
      return m === n || (alias[t.id]?.includes(n) ?? false)
    })
    columnas.push({ indice: i, cabecera, tresEstados, destino: existente?.id ?? 'nueva', cuenta })
  }
  return { hoja, columnaNombre: texto(cabeceras[col] ?? null), columnas, filas: datos }
}

/** Valor a guardar para una celda (undefined = no tocar). */
export function valorPara(celda: Celda): EstadoAutorizacion | undefined {
  const l = interpretar(celda)
  return l === 'tostemp' ? 'si' : l === 'vacio' || l === null ? undefined : l
}
