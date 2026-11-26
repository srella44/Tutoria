// Los registros del prototipo viven en memoria. Los borradores oficiales tienen su propio almacén cifrado.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { guardarBorradorOficial, leerBorradoresOficiales, type BorradorOficial } from './borradoresOficiales'
import * as demo from './demo'
import { citaRealizada, type Acuerdo, type Aher, type Registro } from './types'

interface Store {
  curso: typeof demo.curso
  alumnos: typeof demo.alumnos
  contactos: typeof demo.contactos
  profesionales: typeof demo.profesionales
  frases: typeof demo.frases
  documentosClaustre: File[]
  addDocumentosClaustre: (archivos: File[]) => void
  registros: Registro[]
  borradoresListos: boolean
  borradores: Partial<Record<string, BorradorOficial>>
  estadoBorradores: Partial<Record<string, 'guardando' | 'guardado' | 'fallo'>>
  setBorrador: (cita: Registro, datos?: BorradorOficial) => void
  acuerdos: Acuerdo[]
  ahers: Aher[]
  addAher: (texto: string, fecha?: string, detalle?: Pick<Aher, 'responsable' | 'origen'>) => void
  toggleAher: (id: string) => void
  toggleCita: (id: string) => void
  addPuntoCita: (id: string, texto: string) => void
  setNotaPuntoCita: (id: string, puntoId: string, notas: string) => void
  togglePuntoCita: (id: string, puntoId: string) => void
  setTextoRegistro: (id: string, texto: string) => void
  addRegistro: (r: Omit<Registro, 'id'>) => void
}

function originalesIncluidos(): File[] {
  const contenido = document.getElementById('tutoria-documentos-privados')?.textContent
  if (!contenido) return []

  const originales: { nombre: string; datos: string }[] = JSON.parse(contenido)
  return originales.map(({ nombre, datos }) => {
    const bytes = Uint8Array.from(atob(datos), (caracter) => caracter.charCodeAt(0))
    return new File([bytes], nombre, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  })
}

const StoreCtx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [documentosClaustre, setDocumentosClaustre] = useState(originalesIncluidos)
  const addDocumentosClaustre = (archivos: File[]) =>
    setDocumentosClaustre((actuales) => [...actuales, ...archivos])
  const [registros, setRegistros] = useState<Registro[]>(demo.registros)
  const [borradores, setBorradores] = useState<Store['borradores']>({})
  const [estadoBorradores, setEstadoBorradores] = useState<Store['estadoBorradores']>({})
  const [borradoresListos, setBorradoresListos] = useState(false)
  const escrituras = useRef(new Map<string, Promise<void>>())

  useEffect(() => {
    let activo = true
    leerBorradoresOficiales().then((guardados) => {
      if (!activo) return
      setBorradores(Object.fromEntries(guardados.map(({ cita, datos }) => [cita.id, datos])))
      setEstadoBorradores(Object.fromEntries(guardados.map(({ cita }) => [cita.id, 'guardado'])))
      setRegistros((actuales) => [...actuales, ...guardados.map(({ cita }) => cita)
        .filter((cita) => !actuales.some((actual) => actual.id === cita.id))])
    }).catch(() => {
      // En el navegador que bloquee IndexedDB se conserva el borrador solo en esta sesión.
    }).finally(() => {
      if (activo) setBorradoresListos(true)
    })
    return () => { activo = false }
  }, [])

  const setBorrador = (cita: Registro, datos?: BorradorOficial) => {
    const { id } = cita
    setBorradores((actuales) => ({ ...actuales, [id]: datos }))
    setEstadoBorradores((actuales) => ({ ...actuales, [id]: 'guardando' }))
    const anterior = escrituras.current.get(id)
    const tarea = (anterior ?? Promise.resolve()).catch(() => undefined).then(() =>
      guardarBorradorOficial(id, datos ? {
        cita: {
          id, tipo: cita.tipo, fecha: cita.fecha, alumnoIds: cita.alumnoIds, texto: '', etiquetas: [],
          visibilidad: cita.visibilidad, alumnosOtrosCursos: cita.alumnosOtrosCursos,
          asistentes: cita.asistentes, realizada: cita.realizada, programada: cita.programada,
          estado: cita.estado,
        },
        datos,
      } : undefined))
    escrituras.current.set(id, tarea)
    const terminar = (estado: 'guardado' | 'fallo') => {
      if (escrituras.current.get(id) !== tarea) return
      escrituras.current.delete(id)
      setEstadoBorradores((actuales) => ({ ...actuales, [id]: estado }))
    }
    void tarea.then(() => terminar('guardado'), () => terminar('fallo'))
  }

  const acuerdosOriginales = demo.acuerdos
  const [ahers, setAhers] = useState<Aher[]>(() => acuerdosOriginales
    .filter((a) => a.responsable === 'Tutor')
    .map((a) => ({ id: a.id, texto: a.texto, fecha: a.fechaRevision, completado: a.estado === 'completado' })))
  const addAher: Store['addAher'] = (texto, fecha, detalle) => {
    const id = crypto.randomUUID()
    setAhers((items) => {
      const origen = detalle?.origen
      if (origen && items.some((a) => a.origen?.citaId === origen.citaId && a.origen?.puntoId === origen.puntoId)) return items
      return [{ id, texto, fecha, completado: false, ...detalle }, ...items]
    })
  }
  const toggleAher = (id: string) => setAhers((items) =>
    items.map((item) => item.id === id ? { ...item, completado: !item.completado } : item))
  const acuerdos: Acuerdo[] = acuerdosOriginales.map((a) => {
    const tarea = ahers.find((item) => item.id === a.id)
    return tarea?.completado ? { ...a, estado: 'completado' } : a
  })
  const setTextoRegistro = (id: string, texto: string) => setRegistros((items) =>
    items.map((r) => r.id === id && r.visibilidad !== 'protegido' ? { ...r, texto } : r))
  const toggleCita = (id: string) => setRegistros((items) =>
    items.map((r) => r.id === id ? { ...r, realizada: !citaRealizada(r) } : r))
  const addPuntoCita = (id: string, texto: string) => {
    const punto = { id: crypto.randomUUID(), texto: texto.trim(), hecho: false }
    if (!punto.texto) return
    setRegistros((items) => items.map((r) => r.id === id && r.visibilidad !== 'protegido'
      ? { ...r, puntos: [...(r.puntos ?? []), punto] } : r))
  }
  const setNotaPuntoCita = (id: string, puntoId: string, notas: string) =>
    setRegistros((items) => items.map((r) => r.id === id && r.visibilidad !== 'protegido'
      ? { ...r, puntos: r.puntos?.map((p) => p.id === puntoId ? { ...p, notas } : p) } : r))
  const togglePuntoCita = (id: string, puntoId: string) => setRegistros((items) =>
    items.map((r) => r.id === id && r.visibilidad !== 'protegido'
      ? { ...r, puntos: r.puntos?.map((p) => p.id === puntoId ? { ...p, hecho: !p.hecho } : p) } : r))
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
        documentosClaustre,
        addDocumentosClaustre,
        registros,
        borradoresListos,
        borradores,
        estadoBorradores,
        setBorrador,
        acuerdos,
        ahers,
        addAher,
        toggleAher,
        toggleCita,
        addPuntoCita,
        setNotaPuntoCita,
        togglePuntoCita,
        setTextoRegistro,
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
