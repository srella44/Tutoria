// Base de datos local (IndexedDB con Dexie). Fase 1: los datos viven en el dispositivo y sobreviven a recargas.
// En la Fase 2 el contenido se cifrará (AES-GCM) antes de guardarse. Ver docs/decisiones/0008.
import Dexie, { type Table } from 'dexie'
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

async function escribirTodo(datos: Datos, modo: 'demo' | 'propio') {
  await db.transaction('rw', [...colecciones.map((c) => db[c]), db.meta], async () => {
    for (const c of colecciones) {
      await db[c].clear()
      await (db[c] as Table<{ id: string }, string>).bulkPut(datos[c] as { id: string }[])
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
  const leidos = await Promise.all(colecciones.map((c) => db[c].toArray()))
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
  const tabla = db[coleccion] as unknown as Table<T, string>
  await db.transaction('rw', tabla, async () => {
    if (cambiados.length) await tabla.bulkPut(cambiados)
    if (borrados.length) await tabla.bulkDelete(borrados)
  })
}
