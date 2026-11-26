import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { ErrorGoogle, autorizarGoogle } from './googleCalendar'

interface Conexion {
  token: string
  expira: number
}

interface GoogleCalendarContext {
  conexion: Conexion | null
  conectar: () => Promise<void>
  desconectar: () => void
  revisarError: (error: unknown) => void
}

const Contexto = createContext<GoogleCalendarContext | null>(null)

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const [conexion, setConexion] = useState<Conexion | null>(null)

  const revisarError = useCallback((error: unknown) => {
    if (error instanceof ErrorGoogle && error.status === 401) setConexion(null)
  }, [])

  return <Contexto.Provider value={{
    conexion,
    conectar: async () => setConexion(await autorizarGoogle()),
    desconectar: () => setConexion(null),
    revisarError,
  }}>{children}</Contexto.Provider>
}

export function useGoogleCalendar() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('GoogleCalendarProvider')
  return contexto
}
