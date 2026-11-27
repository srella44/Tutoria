// Base de datos local (IndexedDB con Dexie). Fase 1: los datos viven en el dispositivo y sobreviven a recargas.
// En la Fase 2 el contenido se cifrará (AES-GCM) antes de guardarse. Ver docs/decisiones/0008.
import Dexie, { type Table } from 'dexie'
import { cifrar, descifrar, generarLlaveDispositivo, type AccesoPin, type Candado, type Cifrado, type Sesion } from '../lib/cripto'
import * as demo from './demo'
import type { Acuerdo, Aher, Alumno, ContactoFamiliar, CursoEscolar, FraseFrecuente, Profesional, Registro, TipoAutorizacion } from './types'

export interface Datos {
  cursos: CursoEscolar[]
  alumnos: Alumno[]
  contactos: ContactoFamiliar[]
  profesionales: Profesional[]
  registros: Registro[]
  acuerdos: Acuerdo[]
  ahers: Aher[]
  frases: FraseFrecuente[]
  autorizaciones: TipoAutorizacion[]
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
  autorizaciones!: Table<TipoAutorizacion, string>
  meta!: Table<{ clave: string; valor: unknown }, string>
  /** Cambios pendientes de subir al servidor (solo con la sincronización activa). */
  cola!: Table<Pendiente, string>

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
    this.version(2).stores({ cola: 'clave' })
    this.version(3).stores({ autorizaciones: 'id' })
  }
}

export interface Pendiente {
  clave: string // `${tabla}:${id}`
  tabla: Coleccion
  id: string
  iv: string // base64
  c: string // base64
  t: number
  borrado: 0 | 1
}

export const db = new TutoriaDB()

const colecciones: Coleccion[] = ['cursos', 'alumnos', 'contactos', 'profesionales', 'registros', 'acuerdos', 'ahers', 'frases', 'autorizaciones']

/** Autorizaciones iniciales (las del control del tutor, curso 2026-27). Ids fijos: iguales en todos los aparatos. */
export const AUTORIZACIONES_INICIALES: TipoAutorizacion[] = [
  { id: 'gessuda', nombre: 'Gessuda', icono: 'bus', orden: 0 },
  { id: 'solet', nombre: 'Solet', icono: 'sol', orden: 1 },
  { id: 'minjador', nombre: 'Minjador', icono: 'cubiertos', orden: 2, tresEstados: true },
  { id: 'foto', nombre: 'Fòto', icono: 'camara', orden: 3 },
]

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
    autorizaciones: AUTORIZACIONES_INICIALES,
  }
}

/** Ids del alumnado de ejemplo (fijos: «a1», «r1»…). Los datos reales usan ids aleatorios (UUID). */
export function idsDemo(): Record<Coleccion, Set<string>> {
  const d = datosDemo()
  return Object.fromEntries(colecciones.map((c) => [c, new Set((d[c] as { id: string }[]).map((x) => x.id))])) as Record<Coleccion, Set<string>>
}

export function datosVacios(): Datos {
  const anyo = new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1
  const curso: CursoEscolar = {
    id: crypto.randomUUID(),
    anyo: `${anyo}-${String(anyo + 1).slice(2)}`,
    grupos: [],
    estado: 'activo',
  }
  return { cursos: [curso], alumnos: [], contactos: [], profesionales: [], registros: [], acuerdos: [], ahers: [], frases: demo.frases, autorizaciones: AUTORIZACIONES_INICIALES }
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
  const leidas = await Promise.all(filas.map(async (f) => {
    if (!f.c || !f.iv) return f
    if (!llaveDatos) return null
    try {
      return await descifrar(llaveDatos, `${coleccion}:${f.id}`, { iv: f.iv, c: f.c })
    } catch {
      // Una fila cifrada con otra llave (de otra cuenta) no se puede abrir: se salta en vez de bloquear la app.
      console.warn('Fila que no se puede descifrar', coleccion, f.id)
      return null
    }
  }))
  return leidas.filter((x) => x !== null)
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
// Sesión abierta (no es un dato personal: la DEK va envuelta con una llave no extraíble).
export async function leerSesion() {
  return (await db.meta.get('sesion'))?.valor as Sesion | undefined
}
export async function guardarSesion(sesion: Sesion) {
  await db.meta.put({ clave: 'sesion', valor: sesion })
}
export async function tocarSesion(ultima: number) {
  const sesion = await leerSesion()
  if (sesion) await guardarSesion({ ...sesion, ultima })
}
export async function borrarSesion() {
  await db.meta.delete('sesion')
}
/** Minutos sin uso hasta el bloqueo automático (1 hora por defecto). */
export const OPCIONES_BLOQUEO = [5, 15, 60, 480] as const
export async function leerMinutosBloqueo() {
  const v = (await db.meta.get('bloqueo-minutos'))?.valor
  return typeof v === 'number' ? v : 60
}
export async function guardarMinutosBloqueo(minutos: number) {
  await db.meta.put({ clave: 'bloqueo-minutos', valor: minutos })
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
  const sync = await syncActiva()
  await db.transaction('rw', [...colecciones.map((c) => db[c]), db.meta, db.cola], async () => {
    for (const [i, c] of colecciones.entries()) {
      if (sync) {
        // Con sincronización: lo que desaparece se borra también en el servidor.
        const nuevos = new Set(filas[i].map((f) => f.id))
        const viejos = (await db[c].toCollection().primaryKeys()) as string[]
        await encolar(c, filas[i], viejos.filter((id) => !nuevos.has(id)))
      }
      await db[c].clear()
      await (db[c] as unknown as Table<Fila, string>).bulkPut(filas[i])
    }
    await db.meta.put({ clave: 'modo', valor: modo })
  })
}

/** Abre la base de datos. La primera vez la rellena con el alumnado ficticio. */
/** El alumnado ficticio solo existe en desarrollo y en la vista previa; la app publicada empieza vacía. */
export const conEjemplo = import.meta.env.DEV || Boolean(import.meta.env.VITE_SINGLEFILE)

export async function cargarDatos(): Promise<{ datos: Datos; modo: 'demo' | 'propio' }> {
  const modo = (await db.meta.get('modo'))?.valor as 'demo' | 'propio' | undefined
  if (!modo) {
    const nuevo = conEjemplo ? 'demo' : 'propio'
    const datos = nuevo === 'demo' ? datosDemo() : datosVacios()
    await escribirTodo(datos, nuevo)
    return { datos, modo: nuevo }
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
  const sync = await syncActiva()
  await db.transaction('rw', tabla, db.cola, async () => {
    if (filas.length) await tabla.bulkPut(filas)
    if (borrados.length) await tabla.bulkDelete(borrados)
    if (sync) await encolar(coleccion, filas, borrados)
  })
  if (sync) avisarCambioLocal()
}

// ── Sincronización (Fase 2, decisión 0010) ───────────────────────────────
// Solo viajan filas cifradas. El servidor (Cloudflare Pages + D1) no tiene la llave.

function aB64(b: ArrayBuffer | Uint8Array) {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b)
  let texto = ''
  for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(texto)
}
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function encolar(tabla: Coleccion, filas: Fila[], borrados: string[]) {
  const t = Date.now()
  const pendientes: Pendiente[] = [
    ...filas.filter((f) => f.iv && f.c).map((f) => ({ clave: `${tabla}:${f.id}`, tabla, id: f.id, iv: aB64(f.iv!), c: aB64(f.c!), t, borrado: 0 as const })),
    ...borrados.map((id) => ({ clave: `${tabla}:${id}`, tabla, id, iv: '', c: '', t, borrado: 1 as const })),
  ]
  if (pendientes.length) await db.cola.bulkPut(pendientes)
}

const oyentesLocales = new Set<() => void>()
function avisarCambioLocal() {
  oyentesLocales.forEach((f) => f())
}
export function alCambiarLocal(f: () => void) {
  oyentesLocales.add(f)
  return () => { oyentesLocales.delete(f) }
}

interface EstadoSync { activa: boolean; version: number; ultima?: number }
export async function estadoSync(): Promise<EstadoSync> {
  return ((await db.meta.get('sync'))?.valor as EstadoSync | undefined) ?? { activa: false, version: 0 }
}
export async function syncActiva() {
  return (await estadoSync()).activa
}
async function guardarEstadoSync(e: EstadoSync) {
  await db.meta.put({ clave: 'sync', valor: e })
}

/** ¿Hay servidor? (la vista previa publicada no lo tiene). */
/**
 * Estado del servidor visto desde un dispositivo sin sincronización activa:
 * 'libre' (aún no hay cuenta: se puede activar), 'cuenta' (ya hay cuenta: este dispositivo debe unirse),
 * 'sin-acceso' (la sesión de Cloudflare Access ha caducado o no hay conexión) o 'sin-servidor' (vista previa).
 */
export type EstadoServidor = 'libre' | 'cuenta' | 'sin-acceso' | 'sin-servidor'
export async function estadoServidor(): Promise<EstadoServidor> {
  if (import.meta.env.VITE_SINGLEFILE) return 'sin-servidor'
  try {
    const r = await fetch('/api/recuperacion', { headers: { accept: 'application/json' } })
    if (r.status === 404) return 'libre'
    if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) return 'cuenta'
    if (r.ok) return 'sin-servidor' // respondió la app en lugar de la API
    return 'sin-acceso'
  } catch {
    return 'sin-acceso' // Access redirige a su página de inicio de sesión y la petición falla
  }
}
export async function servidorDisponible() {
  return ['libre', 'cuenta'].includes(await estadoServidor())
}

/** Guarda en el servidor la copia de la llave para la clave de recuperación y, si se da, la del PIN. */
export async function subirAccesoServidor(candado: Candado, acceso?: AccesoPin) {
  const r = await fetch('/api/recuperacion', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      salt: aB64(candado.saltRecuperacion), iv: aB64(candado.ivRecuperacion), dek: aB64(candado.dekRecuperacion),
      ...(acceso && { pinSalt: aB64(acceso.pinSalt), pinIv: aB64(acceso.pinIv), pinDek: aB64(acceso.pinDek) }),
    }),
  })
  if (!r.ok) throw new Error(`recuperacion ${r.status}`)
}

/** Activa la sincronización en este dispositivo: sube la copia de recuperación y todos los datos. */
export async function activarSync(candado: Candado, acceso?: AccesoPin) {
  // Si el servidor ya tiene una cuenta (de otro dispositivo), este no puede activar con su propia llave:
  // tiene que unirse. Así nunca se mezclan datos de dos llaves.
  const existente = await fetch('/api/recuperacion')
  if (existente.ok) throw new Error('cuenta-existente')
  if (existente.status !== 404) throw new Error(`recuperacion ${existente.status}`)
  await subirAccesoServidor(candado, acceso)
  for (const c of colecciones) {
    const filas = (await db[c].toArray()) as Fila[]
    await encolar(c, filas.filter((f) => f.c), [])
  }
  await guardarEstadoSync({ activa: true, version: 0 })
  return sincronizarAhora()
}

/** Descarga del servidor la copia de recuperación (para unir un dispositivo nuevo). */
export async function descargarRecuperacion() {
  const r = await fetch('/api/recuperacion')
  if (!r.ok) return null
  const d = (await r.json()) as { salt: string; iv: string; dek: string; pinSalt?: string; pinIv?: string; pinDek?: string }
  return {
    saltRecuperacion: deB64(d.salt), ivRecuperacion: deB64(d.iv), dekRecuperacion: deB64(d.dek).buffer,
    pin: d.pinSalt && d.pinIv && d.pinDek
      ? { pinSalt: deB64(d.pinSalt), pinIv: deB64(d.pinIv), pinDek: deB64(d.pinDek).buffer } as AccesoPin
      : undefined,
  }
}

/** Prepara un dispositivo nuevo unido a la cuenta: sin ejemplo, con sincronización activa. */
export async function prepararDispositivoUnido() {
  await db.meta.put({ clave: 'modo', valor: 'propio' })
  await guardarEstadoSync({ activa: true, version: 0 })
}

let enCurso: Promise<boolean> | null = null
/** Sube lo pendiente y baja lo nuevo. Devuelve true si llegaron cambios de otro dispositivo. */
export function sincronizarAhora(): Promise<boolean> {
  enCurso ??= (async () => {
    try {
      const estado = await estadoSync()
      if (!estado.activa) return false
      // Subir
      for (;;) {
        const lote = await db.cola.limit(200).toArray()
        if (!lote.length) break
        const r = await fetch('/api/sync', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filas: lote.map(({ tabla, id, iv, c, t, borrado }) => ({ tabla, id, iv, c, t, borrado })) }),
        })
        if (!r.ok) throw new Error(`sync POST ${r.status}`)
        // Solo se quita de la cola si no ha cambiado mientras se subía.
        await db.transaction('rw', db.cola, async () => {
          for (const p of lote) {
            const actual = await db.cola.get(p.clave)
            if (actual && actual.t === p.t) await db.cola.delete(p.clave)
          }
        })
      }
      // Bajar
      let version = estado.version
      let cambios = false
      for (;;) {
        const r = await fetch(`/api/sync?desde=${version}`)
        if (!r.ok) throw new Error(`sync GET ${r.status}`)
        const { filas, mas } = (await r.json()) as { filas: (Omit<Pendiente, 'clave'> & { version: number })[]; mas: boolean }
        for (const f of filas) {
          version = Math.max(version, f.version)
          if (!colecciones.includes(f.tabla)) continue
          // Si aquí hay un cambio más reciente sin subir, gana el local.
          const local = await db.cola.get(`${f.tabla}:${f.id}`)
          if (local && local.t > f.t) continue
          const tabla = db[f.tabla] as unknown as Table<Fila, string>
          const existente = (await tabla.get(f.id)) as Fila | undefined
          if (f.borrado) {
            if (existente) { await tabla.delete(f.id); cambios = true }
          } else if (!existente?.c || aB64(existente.c) !== f.c) {
            await tabla.put({ id: f.id, iv: deB64(f.iv), c: deB64(f.c).buffer })
            cambios = true
          }
        }
        if (!mas) break
      }
      await guardarEstadoSync({ activa: true, version, ultima: Date.now() })
      return cambios
    } finally {
      enCurso = null
    }
  })()
  return enCurso
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

// ── Copia de seguridad (decisión 0013) ───────────────────────────────────
// Un archivo .json con las filas tal como están guardadas (cifradas) y la copia de la llave envuelta con la
// clave de recuperación. Sin la llave del dispositivo ni la clave de papel, el archivo no se puede leer.
export interface CopiaSeguridad {
  formato: 'tutoria-copia'
  version: 1
  fecha: string
  recuperacion: { salt: string; iv: string; dek: string }
  filas: Record<string, { id: string; iv: string; c: string }[]>
}

export async function crearCopia(candado: Candado): Promise<Blob> {
  const filas: CopiaSeguridad['filas'] = {}
  for (const c of colecciones) {
    filas[c] = ((await db[c].toArray()) as Fila[]).filter((f) => f.iv && f.c).map((f) => ({ id: f.id, iv: aB64(f.iv!), c: aB64(f.c!) }))
  }
  const copia: CopiaSeguridad = {
    formato: 'tutoria-copia', version: 1, fecha: new Date().toISOString(),
    recuperacion: { salt: aB64(candado.saltRecuperacion), iv: aB64(candado.ivRecuperacion), dek: aB64(candado.dekRecuperacion) },
    filas,
  }
  await db.meta.put({ clave: 'ultima-copia', valor: copia.fecha })
  return new Blob([JSON.stringify(copia)], { type: 'application/json' })
}

export async function ultimaCopia() {
  return (await db.meta.get('ultima-copia'))?.valor as string | undefined
}

export function leerCopia(texto: string): CopiaSeguridad | null {
  try {
    const c = JSON.parse(texto) as CopiaSeguridad
    return c.formato === 'tutoria-copia' && c.version === 1 && c.filas && c.recuperacion ? c : null
  } catch {
    return null
  }
}

export const recuperacionDeCopia = (c: CopiaSeguridad) =>
  ({ salt: deB64(c.recuperacion.salt), iv: deB64(c.recuperacion.iv), dek: deB64(c.recuperacion.dek).buffer as ArrayBuffer })

/** Prueba de restauración: descifra todo con la llave dada. Devuelve los datos o null si alguna fila falla. */
export async function abrirCopia(copia: CopiaSeguridad, dek: CryptoKey): Promise<Datos | null> {
  try {
    const datos = {} as Record<Coleccion, unknown[]>
    for (const c of colecciones) {
      datos[c] = await Promise.all((copia.filas[c] ?? []).map((f) =>
        descifrar(dek, `${c}:${f.id}`, { iv: deB64(f.iv), c: deB64(f.c).buffer as ArrayBuffer })))
    }
    return datos as unknown as Datos
  } catch {
    return null
  }
}

/** Sustituye todos los datos por los de una copia (se vuelven a cifrar con la llave actual y se sincronizan). */
export async function restaurarDatos(datos: Datos) {
  await escribirTodo(datos, 'propio')
  return datos
}
