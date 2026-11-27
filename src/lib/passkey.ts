// Desbloqueo con Face ID / Touch ID / Windows Hello mediante passkeys (WebAuthn) y su extensión PRF.
// Ver docs/decisiones/0011.
//
// La passkey devuelve, tras la verificación biométrica, un secreto PRF de 32 bytes que solo el autenticador
// puede calcular. De ese secreto se deriva (HKDF) una llave AES-GCM que envuelve la llave de datos (DEK).
// · En el dispositivo: desbloquear sin PIN.
// · En el servidor (cifrado, ilegible para él): unir un dispositivo nuevo con una passkey sincronizada
//   (llavero de iCloud) en lugar de la clave de recuperación.

type Bytes = Uint8Array<ArrayBuffer>

export interface EnvoltorioPasskey {
  /** id de la credencial (base64url) */
  id: string
  iv: Bytes
  dek: ArrayBuffer
}

const codificador = new TextEncoder()
const aleatorio = (n: number) => crypto.getRandomValues(new Uint8Array(n)) as Bytes
const aB64u = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b : new Uint8Array(b)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const deB64u = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0)) as Bytes

// Sal fija de la PRF: así un dispositivo nuevo puede pedir el secreto sin saber antes qué credencial usará.
// El secreto sigue siendo distinto para cada passkey.
const SAL_PRF = codificador.encode('tutoria-prf-v1').buffer as ArrayBuffer

export const passkeyPosible = () => typeof window !== 'undefined' && 'PublicKeyCredential' in window && Boolean(navigator.credentials)

type ConPrf = { prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } } }

async function llaveDePrf(prf: ArrayBuffer) {
  const material = await crypto.subtle.importKey('raw', prf, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: codificador.encode('tutoria-dek') },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

/** Pide la verificación (Face ID…) y devuelve el id de la credencial usada y su secreto PRF. */
async function obtenerPrf(id?: string) {
  const cred = (await navigator.credentials.get({
    publicKey: {
      challenge: aleatorio(32),
      rpId: location.hostname,
      userVerification: 'required',
      timeout: 60_000,
      allowCredentials: id ? [{ type: 'public-key', id: deB64u(id) }] : [],
      extensions: { prf: { eval: { first: SAL_PRF } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null
  if (!cred) throw new Error('cancelado')
  const prf = (cred.getClientExtensionResults() as ConPrf).prf?.results?.first
  if (!prf) throw new Error('sin-prf')
  return { id: aB64u(cred.rawId), prf }
}

/** Crea una passkey para TUTOR-ia y envuelve con ella la DEK. Lanza 'sin-prf' si el aparato no lo permite. */
export async function registrarPasskey(dek: CryptoKey): Promise<EnvoltorioPasskey> {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: aleatorio(32),
      rp: { name: 'TUTOR-ia', id: location.hostname },
      user: { id: aleatorio(16), name: 'TUTOR-ia', displayName: 'TUTOR-ia' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      timeout: 60_000,
      extensions: { prf: { eval: { first: SAL_PRF } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null
  if (!cred) throw new Error('cancelado')
  const id = aB64u(cred.rawId)
  const ext = (cred.getClientExtensionResults() as ConPrf).prf
  if (!ext?.enabled && !ext?.results?.first) throw new Error('sin-prf')
  // Algunos aparatos solo dan el secreto al usarla, no al crearla.
  const prf = ext.results?.first ?? (await obtenerPrf(id)).prf
  const iv = aleatorio(12)
  const raw = await crypto.subtle.exportKey('raw', dek)
  return { id, iv, dek: await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await llaveDePrf(prf), raw) }
}

/**
 * Abre una DEK envuelta con passkey. Con `envoltorio` usa esa credencial; sin él, deja elegir cualquier passkey
 * de TUTOR-ia (dispositivo nuevo) y `buscar` trae del servidor el envoltorio de la credencial elegida.
 */
export async function abrirConPasskey(envoltorio?: EnvoltorioPasskey, buscar?: (id: string) => Promise<EnvoltorioPasskey | null>) {
  const { id, prf } = await obtenerPrf(envoltorio?.id)
  const env = envoltorio ?? (buscar ? await buscar(id) : null)
  if (!env) throw new Error('sin-envoltorio')
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: env.iv }, await llaveDePrf(prf), env.dek)
  const dek = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
  return { dek, envoltorio: env }
}

export const envoltorioAJson = (e: EnvoltorioPasskey) => ({ id: e.id, iv: aB64u(e.iv), dek: aB64u(e.dek) })
export const envoltorioDeJson = (j: { id: string; iv: string; dek: string }): EnvoltorioPasskey =>
  ({ id: j.id, iv: deB64u(j.iv), dek: deB64u(j.dek).buffer as ArrayBuffer })
