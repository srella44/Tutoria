// Cifrado de extremo a extremo en el dispositivo (Fase 2). Ver docs/decisiones/0009.
//
// · Una llave de datos (DEK, AES-GCM 256) cifra cada registro antes de guardarlo.
// · La DEK se guarda envuelta dos veces: con una llave derivada del PIN (PBKDF2-SHA-256, 600 000 iteraciones)
//   y, encima, con una llave del dispositivo no extraíble. Copiar la base no basta sin el PIN, y el PIN no
//   basta sin el dispositivo.
// · Tras MAX_INTENTOS fallos se borra esa copia: solo la clave de recuperación (en papel) la recupera.
// · La clave de recuperación envuelve otra copia de la DEK (PBKDF2 con su propia sal).

const ITERACIONES = 600_000
export const MAX_INTENTOS = 5

type Bytes = Uint8Array<ArrayBuffer>

export interface Candado {
  version: 1
  saltPin: Bytes
  /** DEK cifrada con la llave del PIN y luego con la llave del dispositivo. */
  ivPin: Bytes
  ivDispositivo: Bytes
  dekPin?: ArrayBuffer // se borra tras demasiados intentos
  intentos: number
  saltRecuperacion: Bytes
  ivRecuperacion: Bytes
  dekRecuperacion: ArrayBuffer
}

export interface Cifrado {
  iv: Bytes
  c: ArrayBuffer
}

const codificador = new TextEncoder()
const decodificador = new TextDecoder()
const aleatorio = (n: number) => crypto.getRandomValues(new Uint8Array(n)) as Bytes

async function derivar(secreto: string, salt: Bytes) {
  const material = await crypto.subtle.importKey('raw', codificador.encode(secreto), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERACIONES, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function generarLlaveDispositivo() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export const importarDek = (raw: ArrayBuffer) =>
  crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])

/** Clave de recuperación: 20 caracteres sin ambigüedades (100 bits), en grupos de 4. */
export function generarClaveRecuperacion() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin I, O, 0, 1
  const bytes = aleatorio(20)
  const letras = [...bytes].map((b) => alfabeto[b % 32]).join('')
  return letras.match(/.{4}/g)!.join('-')
}
export const normalizarClave = (clave: string) => clave.toUpperCase().replace(/[^A-Z0-9]/g, '')

async function envolverConPin(dekRaw: ArrayBuffer, pin: string, dispositivo: CryptoKey) {
  const saltPin = aleatorio(16)
  const ivPin = aleatorio(12)
  const ivDispositivo = aleatorio(12)
  const conPin = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivPin }, await derivar(pin, saltPin), dekRaw)
  const dekPin = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: ivDispositivo }, dispositivo, conPin)
  return { saltPin, ivPin, ivDispositivo, dekPin, intentos: 0 }
}

/** Crea la llave de datos y el candado. Devuelve la DEK (en memoria) y la clave de recuperación. */
export async function crearCandado(pin: string, dispositivo: CryptoKey) {
  const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const dekRaw = await crypto.subtle.exportKey('raw', dek)
  const clave = generarClaveRecuperacion()
  const saltRecuperacion = aleatorio(16)
  const ivRecuperacion = aleatorio(12)
  const dekRecuperacion = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivRecuperacion }, await derivar(normalizarClave(clave), saltRecuperacion), dekRaw)
  const candado: Candado = {
    version: 1,
    ...(await envolverConPin(dekRaw, pin, dispositivo)),
    saltRecuperacion, ivRecuperacion, dekRecuperacion,
  }
  return { dek, candado, clave }
}

/** Abre el candado con el PIN. Devuelve la DEK o null si el PIN no es correcto. */
export async function abrirConPin(candado: Candado, pin: string, dispositivo: CryptoKey) {
  if (!candado.dekPin) return null
  try {
    const conPin = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: candado.ivDispositivo }, dispositivo, candado.dekPin)
    const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: candado.ivPin }, await derivar(pin, candado.saltPin), conPin)
    return importarDek(raw)
  } catch {
    return null
  }
}

/** Abre con la clave de recuperación y fija un PIN nuevo. Devuelve DEK y candado nuevo, o null. */
export async function recuperar(candado: Candado, clave: string, pinNuevo: string, dispositivo: CryptoKey) {
  try {
    const raw = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: candado.ivRecuperacion },
      await derivar(normalizarClave(clave), candado.saltRecuperacion),
      candado.dekRecuperacion,
    )
    return { dek: await importarDek(raw), candado: { ...candado, ...(await envolverConPin(raw, pinNuevo, dispositivo)) } }
  } catch {
    return null
  }
}

/** Cambia el PIN (con la DEK ya abierta). */
export async function cambiarPin(candado: Candado, dek: CryptoKey, pinNuevo: string, dispositivo: CryptoKey): Promise<Candado> {
  const raw = await crypto.subtle.exportKey('raw', dek)
  return { ...candado, ...(await envolverConPin(raw, pinNuevo, dispositivo)) }
}

/** Cifra un objeto. El contexto (tabla e id) va como dato adicional: un registro no se puede mover a otro sitio. */
export async function cifrar(dek: CryptoKey, contexto: string, valor: unknown): Promise<Cifrado> {
  const iv = aleatorio(12)
  const c = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: codificador.encode(contexto) }, dek, codificador.encode(JSON.stringify(valor)))
  return { iv, c }
}

export async function descifrar<T>(dek: CryptoKey, contexto: string, { iv, c }: Cifrado): Promise<T> {
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: codificador.encode(contexto) }, dek, c)
  return JSON.parse(decodificador.decode(bytes)) as T
}

// ── Sesión abierta ────────────────────────────────────────────────────────
// Para no pedir el PIN en cada recarga: mientras la app se use, la DEK se guarda envuelta con una llave de
// sesión no extraíble. Caduca con el bloqueo automático (o al bloquear a mano) y entonces se borra.
export interface Sesion {
  llave: CryptoKey
  iv: Bytes
  dek: ArrayBuffer
  ultima: number
}

export async function crearSesion(dek: CryptoKey): Promise<Sesion> {
  const llave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const iv = aleatorio(12)
  const raw = await crypto.subtle.exportKey('raw', dek)
  return { llave, iv, dek: await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, llave, raw), ultima: Date.now() }
}

export async function abrirSesion(sesion: Sesion) {
  try {
    return await importarDek(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sesion.iv }, sesion.llave, sesion.dek))
  } catch {
    return null
  }
}
