// Importación de alumnado desde Excel (.xlsx) o CSV. Todo ocurre en el navegador: el fichero no sale del dispositivo.
// Reconoce cabeceras en aranés, castellano y catalán (p. ej. «Nòm e cognòms», «Data de neishement»,
// «Corrèu electronic Tutor/tutriz 1», «Telefon Tutor/tutriz 2», «Auto. imatge»).

export type Celda = string | number | boolean | Date | null

export interface Tutor {
  numero: number
  nombre?: string
  correos: string[]
  telefonos: string[]
  /** Hay un correo al que le falta la @: conviene revisarlo a mano. */
  revisar: boolean
}

export interface FilaImportada {
  fila: number
  numero?: number
  palabras: string[]
  /** Índice de la primera palabra de los apellidos (nombre = palabras[0..corte)). */
  corte: number
  nombreCompletoSeparado: boolean
  nacimiento: string
  localidad?: string
  grupo?: string
  autorizacionImagen?: boolean
  tutores: Tutor[]
}

export interface ResultadoImportacion {
  hoja: string
  columnas: string[]
  filas: FilaImportada[]
}

export const normalizar = (v: Celda) =>
  String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

export const texto = (v: Celda) => (v instanceof Date ? '' : String(v ?? '').replace(/\s+/g, ' ').trim())

function fecha(v: Celda): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10) // Excel guarda las fechas sin zona: se leen en UTC
  const t = texto(v)
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) {
    const anyo = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${anyo}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
}

type Campo = 'numero' | 'nombreCompleto' | 'nombre' | 'apellidos' | 'nacimiento' | 'localidad' | 'grupo' | 'imagen' | 'correo' | 'telefono'

function reconocer(cabecera: string): Campo | undefined {
  const h = cabecera
  if (/^(n|no|nº|n°|num|numero)\.?$/.test(h)) return 'numero'
  if (/(nom|nombre).*(cognom|apellido)/.test(h)) return 'nombreCompleto'
  if (/(cognom|apellido)/.test(h)) return 'apellidos'
  if (/^(nom|nombre)$/.test(h)) return 'nombre'
  if (/(neish|nacim|naixe|naissa)/.test(h)) return 'nacimiento'
  if (/(localit|residen|poblac|municip)/.test(h)) return 'localidad'
  if (/(imatg|imagen)/.test(h)) return 'imagen'
  if (/(correu|correo|mail)/.test(h)) return 'correo'
  if (/(telef|movil|mobil)/.test(h)) return 'telefono'
  if (/^(grup|grupo|clase|classe)$/.test(h)) return 'grupo'
  return undefined
}

export function parsearCsv(contenido: string): Celda[][] {
  const primera = contenido.split(/\r?\n/, 1)[0] ?? ''
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ';' : ','
  const filas: Celda[][] = []
  let fila: string[] = []
  let celda = ''
  let comillas = false
  for (let i = 0; i < contenido.length; i++) {
    const c = contenido[i]
    if (comillas) {
      if (c === '"' && contenido[i + 1] === '"') { celda += '"'; i++ }
      else if (c === '"') comillas = false
      else celda += c
    } else if (c === '"') comillas = true
    else if (c === sep) { fila.push(celda); celda = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && contenido[i + 1] === '\n') i++
      fila.push(celda); filas.push(fila); fila = []; celda = ''
    } else celda += c
  }
  if (celda || fila.length) { fila.push(celda); filas.push(fila) }
  return filas
}

/** Separa el contenido de una celda de contacto: correos, nombre y avisos. */
function leerContacto(valor: string) {
  const correos: string[] = []
  let nombre: string | undefined
  let revisar = false
  for (const parte of valor.split(/[|;/]/).map((x) => x.trim()).filter(Boolean)) {
    if (parte.includes('@')) correos.push(parte)
    else if (/^[\w.+-]+(gmail|hotmail|yahoo|outlook|icloud|xtec)\.[a-z.]+$/i.test(parte)) {
      correos.push(parte) // correo al que le falta la @
      revisar = true
    } else {
      nombre ??= parte // p. ej. «Nombre | correo»: el nombre del tutor
    }
  }
  return { correos, nombre, revisar }
}

export async function leerArchivo(archivo: File): Promise<ResultadoImportacion> {
  let filas: Celda[][]
  let hoja: string
  if (/\.csv$/i.test(archivo.name) || archivo.type === 'text/csv') {
    filas = parsearCsv(await archivo.text())
    hoja = archivo.name.replace(/\.csv$/i, '')
  } else {
    // El lector de Excel solo se descarga al importar.
    const { default: readXlsxFile } = await import('read-excel-file/browser')
    const hojas = await readXlsxFile(archivo)
    const primera = hojas[0]
    filas = primera.data as Celda[][]
    hoja = primera.sheet
  }

  const iCabecera = filas.findIndex((f) => f.some((c) => {
    const campo = reconocer(normalizar(c))
    return campo === 'nombreCompleto' || campo === 'nombre'
  }))
  if (iCabecera < 0) throw new Error('sin-columna-nombre')

  const cabeceras = filas[iCabecera].map((c) => normalizar(c))
  const mapa = cabeceras.map((h) => {
    const campo = reconocer(h)
    const numero = Number(h.match(/(\d)\s*$/)?.[1] ?? h.match(/tut\S*\s*(\d)/)?.[1] ?? 0)
    return { campo, numero }
  })
  // Correos y teléfonos sin número: se numeran por orden de aparición.
  for (const tipo of ['correo', 'telefono'] as const) {
    let n = 0
    mapa.forEach((m) => { if (m.campo === tipo && !m.numero) m.numero = ++n })
  }

  const resultado: FilaImportada[] = []
  filas.slice(iCabecera + 1).forEach((f, k) => {
    const valor = (campo: Campo) => f[mapa.findIndex((m) => m.campo === campo)] ?? null
    const completo = texto(valor('nombreCompleto'))
    const nombre = texto(valor('nombre'))
    const apellidos = texto(valor('apellidos'))
    const palabras = (completo || `${nombre} ${apellidos}`).split(' ').filter(Boolean)
    if (!palabras.length) return

    const tutores = new Map<number, Tutor>()
    mapa.forEach((m, j) => {
      if ((m.campo !== 'correo' && m.campo !== 'telefono') || !texto(f[j] ?? null)) return
      const tutor = tutores.get(m.numero) ?? { numero: m.numero, correos: [], telefonos: [], revisar: false }
      if (m.campo === 'telefono') tutor.telefonos.push(texto(f[j] ?? null))
      else {
        const c = leerContacto(texto(f[j] ?? null))
        tutor.correos.push(...c.correos)
        tutor.nombre ??= c.nombre
        tutor.revisar ||= c.revisar
      }
      tutores.set(m.numero, tutor)
    })

    const numero = Number(texto(valor('numero')))
    const imagen = texto(valor('imagen')).toLowerCase()
    resultado.push({
      fila: iCabecera + k + 2,
      numero: Number.isFinite(numero) && numero > 0 ? numero : undefined,
      palabras,
      corte: completo ? 1 : Math.max(1, nombre.split(' ').filter(Boolean).length),
      nombreCompletoSeparado: !completo,
      nacimiento: fecha(valor('nacimiento')),
      localidad: texto(valor('localidad')) || undefined,
      grupo: texto(valor('grupo')) || undefined,
      autorizacionImagen: mapa.some((m) => m.campo === 'imagen')
        ? imagen !== '' && !/^(no|non|n|-|0)$/.test(imagen)
        : undefined,
      tutores: [...tutores.values()].sort((a, b) => a.numero - b.numero),
    })
  })

  return {
    hoja,
    columnas: filas[iCabecera].map((c) => texto(c)).filter(Boolean),
    filas: resultado,
  }
}

export const claveNombre = (nombre: string, apellidos: string) => normalizar(`${nombre} ${apellidos}`)

/** Todas las hojas de un Excel (o el CSV como una sola hoja). */
export async function leerHojas(archivo: File): Promise<{ hoja: string; filas: Celda[][] }[]> {
  if (/\.csv$/i.test(archivo.name) || archivo.type === 'text/csv') {
    return [{ hoja: archivo.name.replace(/\.csv$/i, ''), filas: parsearCsv(await archivo.text()) }]
  }
  const { default: readXlsxFile } = await import('read-excel-file/browser')
  return (await readXlsxFile(archivo)).map((h) => ({ hoja: h.sheet, filas: h.data as Celda[][] }))
}
