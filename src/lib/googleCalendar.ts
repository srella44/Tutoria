import type { Registro } from '../data/types'

type TokenResponse = { access_token?: string; expires_in?: number | string }
type TokenClient = { requestAccessToken: (options: { prompt: string }) => void }
type GoogleWindow = Window & {
  google?: { accounts: { oauth2: { initTokenClient: (options: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback: () => void
  }) => TokenClient } } }
}

export interface EventoGoogle {
  id: string
  summary?: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
  extendedProperties?: { private?: { tutoriaRegistro?: string } }
}

export const googleConfigurado = Boolean(import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID) && !import.meta.env.VITE_SINGLEFILE
const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const google = () => (window as GoogleWindow).google
let carga: Promise<void> | undefined

export function cargarGoogle() {
  if (google()) return Promise.resolve()
  carga ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => google() ? resolve() : reject(new Error('Google Identity Services'))
    script.onerror = () => reject(new Error('Google Identity Services'))
    document.head.append(script)
  }).catch((error: unknown) => {
    carga = undefined
    throw error
  })
  return carga
}

export function autorizarGoogle() {
  return new Promise<{ token: string; expira: number }>((resolve, reject) => {
    const identidad = google()
    if (!identidad) {
      reject(new Error('Google Identity Services'))
      return
    }
    identidad.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/calendar.events.owned',
      callback: ({ access_token, expires_in }) => {
        if (access_token) resolve({ token: access_token, expira: Date.now() + Number(expires_in ?? 3600) * 1000 })
        else reject(new Error('Google OAuth'))
      },
      error_callback: () => reject(new Error('Google OAuth')),
    }).requestAccessToken({ prompt: 'select_account' })
  })
}

export class ErrorGoogle extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Google Calendar: ${status}`)
    this.status = status
  }
}

async function consultar(token: string, url: URL | string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!response.ok) throw new ErrorGoogle(response.status)
  return response
}

async function listar(token: string, filtros: Record<string, string>, signal?: AbortSignal) {
  const url = new URL(base)
  for (const [key, value] of Object.entries(filtros)) url.searchParams.set(key, value)
  const eventos: EventoGoogle[] = []
  let pagina: string | undefined
  do {
    if (pagina) url.searchParams.set('pageToken', pagina)
    const response = await consultar(token, url, { signal })
    const datos: { items?: EventoGoogle[]; nextPageToken?: string } = await response.json()
    eventos.push(...(datos.items ?? []))
    pagina = datos.nextPageToken
  } while (pagina)
  return eventos
}

export function listarMesGoogle(token: string, mes: Date, signal: AbortSignal) {
  const siguiente = new Date(mes.getFullYear(), mes.getMonth() + 1, 1)
  return listar(token, {
    timeMin: mes.toISOString(),
    timeMax: siguiente.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  }, signal)
}

function eventosDeCita(token: string, id: string, signal?: AbortSignal) {
  return listar(token, { privateExtendedProperty: `tutoriaRegistro=${id}`, showDeleted: 'false' }, signal)
}

export async function estaEnGoogle(token: string, id: string, signal: AbortSignal) {
  return (await eventosDeCita(token, id, signal)).length > 0
}

export async function reflejarCitaGoogle(token: string, r: Registro, titulo: string, incluir: boolean) {
  const existentes = await eventosDeCita(token, r.id)
  if (!incluir) {
    for (const evento of existentes) {
      try {
        await consultar(token, `${base}/${encodeURIComponent(evento.id)}`, { method: 'DELETE' })
      } catch (error) {
        if (!(error instanceof ErrorGoogle && [404, 410].includes(error.status))) throw error
      }
    }
    return
  }
  const evento = existentes[0]
  const body = JSON.stringify({
    summary: titulo,
    start: { dateTime: new Date(r.fecha).toISOString() },
    end: { dateTime: new Date(Date.parse(r.fecha) + 30 * 60_000).toISOString() },
    visibility: 'private',
    extendedProperties: { private: { tutoriaRegistro: r.id } },
  })
  await consultar(token, evento ? `${base}/${encodeURIComponent(evento.id)}` : base, {
    method: evento ? 'PATCH' : 'POST',
    body,
  })
}
