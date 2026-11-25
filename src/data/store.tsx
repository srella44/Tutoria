// Fase 0: los datos viven en memoria (se pierden al recargar).
// En la Fase 1 este store pasa a IndexedDB con Dexie; en la Fase 2, cifrado.
import { createContext, useContext, useState, type ReactNode } from 'react'
import * as demo from './demo'
import type { Acuerdo, Registro } from './types'

interface Store {
  curso: typeof demo.curso
  alumnos: typeof demo.alumnos
  contactos: typeof demo.contactos
  profesionales: typeof demo.profesionales
  frases: typeof demo.frases
  registros: Registro[]
  acuerdos: Acuerdo[]
  addRegistro: (r: Omit<Registro, 'id'>) => void
}

const StoreCtx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [registros, setRegistros] = useState<Registro[]>(demo.registros)
  const [acuerdos] = useState<Acuerdo[]>(demo.acuerdos)
  const addRegistro = (r: Omit<Registro, 'id'>) =>
    setRegistros((rs) => [{ ...r, id: crypto.randomUUID() }, ...rs])
  return (
    <StoreCtx.Provider
      value={{
        curso: demo.curso,
        alumnos: demo.alumnos,
        contactos: demo.contactos,
        profesionales: demo.profesionales,
        frases: demo.frases,
        registros,
        acuerdos,
        addRegistro,
      }}
    >
      {children}
    </StoreCtx.Provider>
  )
}

export function useStore() {
  const s = useContext(StoreCtx)
  if (!s) throw new Error('useStore fuera de StoreProvider')
  return s
}
