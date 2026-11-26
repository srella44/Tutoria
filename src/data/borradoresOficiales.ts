import type { Registro } from './types'

export interface BorradorOficial {
  valores: Record<string, string>
  motivos: number[]
  firmas: (string | null)[]
}

export interface BorradorGuardado {
  cita: Registro
  datos: BorradorOficial
}

interface EntradaCifrada {
  id: string
  iv: Uint8Array<ArrayBuffer>
  contenido: ArrayBuffer
}

let conexion: Promise<IDBDatabase> | undefined
let clave: Promise<CryptoKey> | undefined

function abrir() {
  conexion ??= new Promise<IDBDatabase>((resolve, reject) => {
    const peticion = indexedDB.open('tutoria-documentos', 1)
    peticion.onupgradeneeded = () => {
      peticion.result.createObjectStore('claves')
      peticion.result.createObjectStore('borradores', { keyPath: 'id' })
    }
    peticion.onsuccess = () => resolve(peticion.result)
    peticion.onerror = () => reject(peticion.error)
  }).catch((error: unknown) => {
    conexion = undefined
    throw error
  })
  return conexion
}

function completar(transaccion: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaccion.oncomplete = () => resolve()
    transaccion.onabort = () => reject(transaccion.error)
    transaccion.onerror = () => reject(transaccion.error)
  })
}

function obtenerClave(db: IDBDatabase) {
  // La transacción de escritura impide que dos pestañas inicialicen claves distintas.
  clave ??= (async () => {
    const candidata = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    const transaccion = db.transaction('claves', 'readwrite')
    const fin = completar(transaccion)
    const almacen = transaccion.objectStore('claves')
    const peticion = almacen.get('documentos')
    let guardada: CryptoKey | undefined
    peticion.onsuccess = () => {
      guardada = peticion.result as CryptoKey | undefined
      if (!guardada) almacen.put(candidata, 'documentos')
    }
    await fin
    return guardada ?? candidata
  })().catch((error: unknown) => {
    clave = undefined
    throw error
  })
  return clave
}

function contexto(id: string) {
  return new TextEncoder().encode(`tutoria-borrador-v1:${id}`)
}

export async function leerBorradoresOficiales() {
  const db = await abrir()
  const llave = await obtenerClave(db)
  const transaccion = db.transaction('borradores', 'readonly')
  const peticion = transaccion.objectStore('borradores').getAll()
  await completar(transaccion)
  const entradas = peticion.result as EntradaCifrada[]
  return Promise.all(entradas.map(async ({ id, iv, contenido }) => {
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: contexto(id) }, llave, contenido)
    return JSON.parse(new TextDecoder().decode(bytes)) as BorradorGuardado
  }))
}

export async function guardarBorradorOficial(id: string, borrador?: BorradorGuardado) {
  const db = await abrir()
  if (!borrador) {
    const transaccion = db.transaction('borradores', 'readwrite')
    transaccion.objectStore('borradores').delete(id)
    await completar(transaccion)
    return
  }

  const llave = await obtenerClave(db)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const bytes = new TextEncoder().encode(JSON.stringify(borrador))
  const contenido = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: contexto(id) }, llave, bytes)
  const transaccion = db.transaction('borradores', 'readwrite')
  transaccion.objectStore('borradores').put({ id, iv, contenido } satisfies EntradaCifrada)
  await completar(transaccion)
}
