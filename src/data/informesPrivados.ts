type Bytes = Uint8Array<ArrayBuffer>

interface Cifrado {
  iv: Bytes
  contenido: ArrayBuffer
}

interface Configuracion {
  salt: Bytes
  verificador: Cifrado
}

interface InformeGuardado {
  id: string
  ficha: Cifrado
}

export interface FichaInforme {
  id: string
  nombre: string
  curso: string
  trimestre: string
  tamano: number
  alumno?: string
  tipo?: 'informe' | 'reunion'
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
let conexion: Promise<IDBDatabase> | undefined

function abrir() {
  conexion ??= new Promise<IDBDatabase>((resolve, reject) => {
    const peticion = indexedDB.open('tutoria-informes-privados-v1', 1)
    peticion.onupgradeneeded = () => {
      peticion.result.createObjectStore('configuracion')
      peticion.result.createObjectStore('informes', { keyPath: 'id' })
      peticion.result.createObjectStore('archivos')
    }
    peticion.onsuccess = () => resolve(peticion.result)
    peticion.onerror = () => reject(peticion.error)
  }).catch((error: unknown) => {
    conexion = undefined
    throw error
  })
  return conexion
}

async function operacion<T>(
  nombre: 'configuracion' | 'informes' | 'archivos',
  modo: IDBTransactionMode,
  ejecutar: (almacen: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await abrir()
  return new Promise<T>((resolve, reject) => {
    const transaccion = db.transaction(nombre, modo)
    const peticion = ejecutar(transaccion.objectStore(nombre))
    transaccion.oncomplete = () => resolve(peticion.result)
    transaccion.onabort = () => reject(transaccion.error)
    transaccion.onerror = () => reject(transaccion.error)
  })
}

async function derivar(contrasena: string, salt: Bytes) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(contrasena), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  )
}

async function cifrar(clave: CryptoKey, contexto: string, bytes: BufferSource): Promise<Cifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const contenido = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(contexto) }, clave, bytes)
  return { iv, contenido }
}

function descifrar(clave: CryptoKey, contexto: string, valor: Cifrado) {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: valor.iv, additionalData: encoder.encode(contexto) }, clave, valor.contenido)
}

export async function existeBanco() {
  const configuracion = await operacion<Configuracion | undefined>('configuracion', 'readonly', (a) => a.get('v1'))
  return !!configuracion
}

export async function abrirBanco(contrasena: string, crear: boolean) {
  const configuracion = await operacion<Configuracion | undefined>('configuracion', 'readonly', (a) => a.get('v1'))
  if (crear === !!configuracion) throw new Error('Banco desactualizado')
  const salt = configuracion?.salt ?? crypto.getRandomValues(new Uint8Array(16))
  const clave = await derivar(contrasena, salt)
  if (configuracion) {
    const verificador = await descifrar(clave, 'verificador', configuracion.verificador)
    if (decoder.decode(verificador) !== 'tutoria-informes-v1') throw new Error('Banco no válido')
  } else {
    const verificador = await cifrar(clave, 'verificador', encoder.encode('tutoria-informes-v1'))
    await operacion('configuracion', 'readwrite', (a) => a.add({ salt, verificador } satisfies Configuracion, 'v1'))
  }
  return clave
}

const normalizarNombre = (valor: string) => valor.normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()

export function alumnoPorArchivo(nombreArchivo: string, alumnado: string[]) {
  const archivo = ` ${normalizarNombre(nombreArchivo.replace(/\.[^.]+$/, ''))} `
  const coincidencias = alumnado.filter((nombre) => {
    const normalizado = normalizarNombre(nombre)
    return normalizado.includes(' ') && archivo.includes(` ${normalizado} `)
  })
  return coincidencias.length === 1 ? coincidencias[0] : undefined
}

export async function leerAlumnadoInformes(clave: CryptoKey): Promise<string[]> {
  const cifrado = await operacion<Cifrado | undefined>('configuracion', 'readonly', (a) => a.get('alumnado'))
  if (!cifrado) return []
  return JSON.parse(decoder.decode(await descifrar(clave, 'alumnado', cifrado))) as string[]
}

export async function guardarAlumnadoInformes(clave: CryptoKey, alumnado: string[]) {
  const cifrado = await cifrar(clave, 'alumnado', encoder.encode(JSON.stringify(alumnado)))
  await operacion('configuracion', 'readwrite', (a) => a.put(cifrado, 'alumnado'))
}

export async function asignarInforme(clave: CryptoKey, informe: FichaInforme, alumno?: string) {
  const { id, ...datos } = informe
  const metadatos = { ...datos, alumno }
  const ficha = await cifrar(clave, `ficha:${id}`, encoder.encode(JSON.stringify(metadatos)))
  await actualizarInforme((t) => {
    const almacen = t.objectStore('informes')
    const existente = almacen.getKey(id)
    existente.onsuccess = () => {
      if (existente.result === undefined) t.abort()
      else almacen.put({ id, ficha } satisfies InformeGuardado)
    }
  })
  return { id, ...metadatos }
}

export async function listarInformes(clave: CryptoKey): Promise<FichaInforme[]> {
  const entradas = await operacion<InformeGuardado[]>('informes', 'readonly', (a) => a.getAll())
  return Promise.all(entradas.map(async ({ id, ficha }) => {
    const bytes = await descifrar(clave, `ficha:${id}`, ficha)
    return { ...JSON.parse(decoder.decode(bytes)) as Omit<FichaInforme, 'id'>, id }
  }))
}

async function actualizarInforme(accion: (t: IDBTransaction) => void) {
  const db = await abrir()
  return new Promise<void>((resolve, reject) => {
    const transaccion = db.transaction(['informes', 'archivos'], 'readwrite')
    transaccion.oncomplete = () => resolve()
    transaccion.onabort = () => reject(transaccion.error)
    transaccion.onerror = () => reject(transaccion.error)
    accion(transaccion)
  })
}

export async function guardarInforme(clave: CryptoKey, file: File, curso: string, trimestre: string, alumno?: string, tipo: FichaInforme['tipo'] = 'informe'): Promise<FichaInforme> {
  const id = crypto.randomUUID()
  const metadatos = { nombre: file.name, curso, trimestre, tamano: file.size, alumno, tipo }
  const ficha = await cifrar(clave, `ficha:${id}`, encoder.encode(JSON.stringify(metadatos)))
  const archivo = await cifrar(clave, `archivo:${id}`, await file.arrayBuffer())
  await actualizarInforme((t) => {
    t.objectStore('informes').add({ id, ficha } satisfies InformeGuardado)
    t.objectStore('archivos').add(archivo, id)
  })
  return { id, ...metadatos }
}

export async function recuperarInforme(clave: CryptoKey, id: string) {
  const entrada = await operacion<Cifrado | undefined>('archivos', 'readonly', (a) => a.get(id))
  if (!entrada) throw new Error('Informe ausente')
  return descifrar(clave, `archivo:${id}`, entrada)
}

export async function quitarInforme(id: string) {
  await actualizarInforme((t) => {
    t.objectStore('informes').delete(id)
    t.objectStore('archivos').delete(id)
  })
}
