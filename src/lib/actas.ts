// Utilidades de las actas definitivas: huella SHA-256, base64 y descarga del PDF.

export function aBase64(bytes: Uint8Array) {
  let texto = ''
  for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(texto)
}

export const deBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

/** Huella SHA-256 en hexadecimal. */
export async function huella(bytes: Uint8Array) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice().buffer as ArrayBuffer))
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Huella corta para mostrar (primeros 4 y últimos 4 grupos). */
export const huellaCorta = (h: string) => `${h.slice(0, 8)}…${h.slice(-8)}`

export function descargarPdf(b64: string, nombre: string) {
  const blob = new Blob([deBase64(b64).buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Las filas sincronizadas tienen un límite de tamaño (D1): un PDF más grande se guarda solo en el aparato. */
export const LIMITE_SYNC_PDF = 1_000_000
