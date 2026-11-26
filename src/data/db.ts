// Base de datos local (IndexedDB con Dexie). Fase 1: los datos viven en el dispositivo y sobreviven a recargas.
// En la Fase 2 el contenido se cifrará (AES-GCM) antes de guardarse. Ver docs/decisiones/0008.
import Dexie, { type Table } from 'dexie'
import { cifrar, descifrar, generarLlaveDispositivo, type Candado, type Cifrado } from '../lib/cripto'
import * as demo from './demo'
import type { Acuerdo, Aher, Alumno, ContactoFamiliar, CursoEscolar, FraseFrecuente, Profesional, Registro } from './types'

export interface Datos {
  cursos: CursoEscolar[]
  alumnos: Alumno[]
  contactos: ContactoFamiliar[]
  profesionales: Profesional[]
  registros: Registro[]
  acuerdos: Acuerdo[]
  ahers: Aher[]
  frases: FraseFrecuente[]
}

export type Coleccion = keyof Datos

class TutoriaDB extends Dexie {
  cursos!: Table<CursoEscolar, string>
  alumnos!: Table<Alumno, string>
  contactos!: Table<ContactoFamiliar, string>
  profesionales!: Table<Profesional, string>
  registros!: Table<Registro, string>
  acuerdos!: Table<Acuerdo, string>
  ahers!: Table<Aher, string>
  frases!: Table<FraseFrecuente, string>
  meta!: Table<{ clave: string; valor: unknown }, string>

  constructor() {
    super('tutoria')
    this.version(1).stores({
      cursos: 'id',
      alumnos: 'id, cursoId',
      contactos: 'id, *alumnoIds',
      profesionales: 'id',
      registros: 'id, tipo, fecha, *alumnoIds',
      acuerdos: 'id, estado, *alumnoIds',
      ahers: 'id',
      frases: 'id',
      meta: 'clave',
    })
  }
}

export const db = new TutoriaDB()

const colecciones: Coleccion[] = ['cursos', 'alumnos', 'contactos', 'profesionales', 'registros', 'acuerdos', 'ahers', 'frases']

/** Ahèrs iniciales: los acuerdos de ejemplo asignados al tutor. */
function ahersDemo(): Aher[] {
  return demo.acuerdos
    .filter((a) => a.responsable === 'Tutor')
    .map((a) => ({ id: a.id, texto: a.texto, fecha: a.fechaRevision, completado: a.estado === 'completado' }))
}

export function datosDemo(): Datos {
  return {
    cursos: [demo.curso],
    alumnos: demo.alumnos,
    contactos: demo.contactos,
    profesionales: demo.profesionales,
    registros: demo.registros,
    acuerdos: demo.acuerdos,
    ahers: ahersDemo(),
    frases: demo.frases,
  }
}

export function datosVacios(): Datos {
  const anyo = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1
  const curso: CursoEscolar = {
    id: crypto.randomUUID(),
    anyo: `${anyo}-${String(anyo + 1).slice(2)}`,
    grupos: [],
    estado: 'activo',
  }
  return { cursos: [curso], alumnos: [], contactos: [], profesionales: [], registros: [], acuerdos: [], ahers: [], frases: demo.frases }
}

// ── Cifrado ───────────────────────────────────────────────────────────────
// Con la llave de datos abierta, cada fila se guarda como { id, iv, c }: solo el id queda a la vista.
// Sin llave (antes de crear el PIN), las filas se guardan tal cual.
let llaveDatos: CryptoKey | null = null
export function usarLlave(dek: CryptoKey | null) {
  llaveDatos = dek
}

type Fila = { id: string } & Partial<Cifrado>

async function preparar(coleccion: Coleccion, items: { id: string }[]): Promise<Fila[]> {
  const dek = llaveDatos
  if (!dek) return items
  return Promise.all(items.map(async (x) => ({ id: x.id, ...(await cifrar(dek, `${coleccion}:${x.id}`, x)) })))
}

async function leer(coleccion: Coleccion) {
  const filas = (await db[coleccion].toArray()) as Fila[]
  return Promise.all(filas.map((f) => (f.c && f.iv && llaveDatos
    ? descifrar(llaveDatos, `${coleccion}:${f.id}`, { iv: f.iv, c: f.c })
    : f)))
}

/** Cifra las filas que aún estén en claro (al crear el PIN). */
export async function cifrarTodo() {
  if (!llaveDatos) throw new Error('sin llave')
  for (const c of colecciones) {
    const enClaro = ((await db[c].toArray()) as Fila[]).filter((f) => !f.c)
    const cifradas = await preparar(c, enClaro)
    if (cifradas.length) await (db[c] as unknown as Table<Fila, string>).bulkPut(cifradas)
  }
}

export async function leerCandado() {
  return (await db.meta.get('candado'))?.valor as Candado | undefined
}
export async function guardarCandado(candado: Candado) {
  await db.meta.put({ clave: 'candado', valor: candado })
}
/** Llave del dispositivo: no extraíble, se crea una vez y no sale de este navegador. */
export async function llaveDispositivo() {
  const guardada = (await db.meta.get('llave-dispositivo'))?.valor as CryptoKey | undefined
  if (guardada) return guardada
  const nueva = await generarLlaveDispositivo()
  await db.meta.put({ clave: 'llave-dispositivo', valor: nueva })
  return nueva
}
/** Borra todo lo de este dispositivo (datos, candado y llave). Sin vuelta atrás. */
export async function borrarDispositivo() {
  llaveDatos = null
  await db.delete()
  await db.open()
}

async function escribirTodo(datos: Datos, modo: 'demo' | 'propio') {
  const filas = await Promise.all(colecciones.map((c) => preparar(c, datos[c] as { id: string }[])))
  await db.transaction('rw', [...colecciones.map((c) => db[c]), db.meta], async () => {
    for (const [i, c] of colecciones.entries()) {
      await db[c].clear()
      await (db[c] as unknown as Table<Fila, string>).bulkPut(filas[i])
    }
    await db.meta.put({ clave: 'modo', valor: modo })
  })
}

/** Abre la base de datos. La primera vez la rellena con el alumnado ficticio. */
export async function cargarDatos(): Promise<{ datos: Datos; modo: 'demo' | 'propio' }> {
  const modo = (await db.meta.get('modo'))?.valor as 'demo' | 'propio' | undefined
  if (!modo) {
    const datos = datosDemo()
    await escribirTodo(datos, 'demo')
    return { datos, modo: 'demo' }
  }
  await corregirContactosImportados()
  const leidos = await Promise.all(colecciones.map((c) => leer(c)))
  const datos = Object.fromEntries(colecciones.map((c, i) => [c, leidos[i]])) as unknown as Datos
  datos.registros.sort((a, b) => b.fecha.localeCompare(a.fecha))
  return { datos, modo }
}

/** Sustituye todos los datos: «empezar en limpio» o «volver al ejemplo». */
export async function reiniciarDatos(modo: 'demo' | 'propio') {
  const datos = modo === 'demo' ? datosDemo() : datosVacios()
  await escribirTodo(datos, modo)
  return datos
}

/** Guarda los cambios de una colección: escribe lo nuevo o modificado y borra lo que ya no está. */
export async function sincronizar<T extends { id: string }>(coleccion: Coleccion, antes: T[], ahora: T[]) {
  const previos = new Map(antes.map((x) => [x.id, x]))
  const ids = new Set(ahora.map((x) => x.id))
  const cambiados = ahora.filter((x) => previos.get(x.id) !== x)
  const borrados = antes.filter((x) => !ids.has(x.id)).map((x) => x.id)
  if (!cambiados.length && !borrados.length) return
  const tabla = db[coleccion] as unknown as Table<Fila, string>
  const filas = await preparar(coleccion, cambiados) // se cifra antes de abrir la transacción
  await db.transaction('rw', tabla, async () => {
    if (filas.length) await tabla.bulkPut(filas)
    if (borrados.length) await tabla.bulkDelete(borrados)
  })
}

/**
 * Corrección única: la primera versión del importador guardaba en «Restricciones» el texto
 * «Revisar: <nombre> · <correo>» cuando la celda traía el nombre del tutor junto al correo.
 * Ese nombre pasa a ser el del contacto y el campo de restricciones queda vacío.
 */
async function corregirContactosImportados() {
  if ((await db.meta.get('migracion-contactos-1'))?.valor) return
  await db.transaction('rw', db.contactos, db.meta, async () => {
    const afectados = (await db.contactos.toArray()).filter((c) => /^Revisa[rt]: /.test(c.restricciones ?? ''))
    for (const c of afectados) {
      const partes = c.restricciones!.replace(/^Revisa[rt]: /, '').split(' · ')
      const nombre = partes.find((x) => !x.includes('@') && !/(gmail|hotmail|yahoo|outlook|icloud|xtec)\./i.test(x))
      const generico = /^Tutor\/(tutriz|a) \d$/.test(c.nombre)
      await db.contactos.put({
        ...c,
        nombre: nombre && generico ? nombre : c.nombre,
        relacion: c.relacion || (generico ? c.nombre : ''),
        restricciones: undefined,
      })
    }
    await db.meta.put({ clave: 'migracion-contactos-1', valor: true })
  })
}
