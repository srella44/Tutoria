// Estado de la app. Fase 1: se carga de IndexedDB (src/data/db.ts) y cada cambio se guarda en el dispositivo.
// Si el navegador bloquea el almacenamiento, funciona en memoria con el alumnado ficticio.
// Los borradores oficiales tienen su propio almacén cifrado.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { guardarBorradorOficial, leerBorradoresOficiales, type BorradorOficial } from './borradoresOficiales'
import { activarSync, alCambiarLocal, cargarDatos, conEjemplo, idsDemo, datosDemo, datosVacios, estadoSync, leerCandado, reiniciarDatos, servidorDisponible, sincronizar, sincronizarAhora, type Coleccion, type Datos } from './db'
import { citaRealizada, type Acuerdo, type Aher, type Alumno, type ContactoFamiliar, type CursoEscolar, type FraseFrecuente, type Profesional, type Registro } from './types'

interface Store {
  /** 'guardado': en IndexedDB · 'memoria': el navegador no deja guardar */
  almacenamiento: 'guardado' | 'memoria'
  /** 'demo': alumnado ficticio · 'propio': empezado en limpio */
  modo: 'demo' | 'propio'
  reiniciar: (modo: 'demo' | 'propio') => Promise<void>
  cursos: CursoEscolar[]
  curso: CursoEscolar
  alumnos: Alumno[]
  contactos: ContactoFamiliar[]
  profesionales: Profesional[]
  frases: FraseFrecuente[]
  /** Alumnado activo (sin archivados): para listas y selectores. `alumnos` incluye los archivados. */
  alumnosActivos: Alumno[]
  guardarAlumno: (a: Alumno) => void
  guardarContacto: (c: ContactoFamiliar) => void
  borrarContacto: (id: string) => void
  guardarProfesional: (p: Profesional) => void
  borrarProfesional: (id: string) => void
  /** Alta en bloque (importación): añade alumnos y contactos y los grupos nuevos al curso. */
  importarAlumnado: (alumnos: Alumno[], contactos: ContactoFamiliar[]) => void
  guardarCurso: (c: CursoEscolar) => void
  /** Activa un curso y archiva el que estaba activo. */
  activarCurso: (id: string) => void
  /** Pasa alumnos a otro curso (conservan id e historial); opcionalmente con grupo nuevo. */
  moverAlumnos: (ids: string[], cursoId: string, grupo?: string) => void
  /** Guarda el orden de la lista: los ids en el orden deseado. */
  ordenarAlumnos: (ids: string[]) => void
  guardarFrase: (f: FraseFrecuente) => void
  borrarFrase: (id: string) => void
  moverFrase: (id: string, delta: -1 | 1) => void
  guardarRegistro: (r: Registro) => void
  borrarRegistro: (id: string) => void
  guardarAcuerdo: (a: Acuerdo) => void
  borrarAcuerdo: (id: string) => void
  guardarAher: (a: Aher) => void
  borrarAher: (id: string) => void
  documentosClaustre: File[]
  addDocumentosClaustre: (archivos: File[]) => void
  registros: Registro[]
  borradoresListos: boolean
  borradores: Partial<Record<string, BorradorOficial>>
  estadoBorradores: Partial<Record<string, 'guardando' | 'guardado' | 'fallo'>>
  setBorrador: (cita: Registro, datos?: BorradorOficial) => void
  acuerdos: Acuerdo[]
  ahers: Aher[]
  addAher: (texto: string, fecha?: string, detalle?: Pick<Aher, 'responsable' | 'origen' | 'hora'>) => void
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

/** Guarda en IndexedDB los cambios de una colección (lo nuevo, lo modificado y lo borrado). */
function usePersistir<T extends { id: string }>(coleccion: Coleccion, items: T[], activo: boolean) {
  const previo = useRef(items)
  useEffect(() => {
    if (!activo) {
      previo.current = items
      return
    }
    const antes = previo.current
    previo.current = items
    sincronizar(coleccion, antes, items).catch((error: unknown) => console.error('No se ha podido guardar', coleccion, error))
  }, [coleccion, items, activo])
}

// ── Sincronización ──
export interface Sincronizacion {
  /** Hay servidor (la app publicada en Cloudflare; la vista previa no lo tiene). */
  disponible: boolean
  estado: 'desactivada' | 'sincronizando' | 'ok' | 'error'
  ultima?: number
  activar: () => Promise<void>
  sincronizar: () => Promise<void>
}
const SyncCtx = createContext<Sincronizacion>({ disponible: false, estado: 'desactivada', activar: async () => {}, sincronizar: async () => {} })
export const useSincronizacion = () => useContext(SyncCtx)

type Inicio = { datos: Datos; modo: 'demo' | 'propio'; almacenamiento: Store['almacenamiento']; revision: number }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [inicio, setInicio] = useState<Inicio>()
  const [sync, setSync] = useState<Pick<Sincronizacion, 'disponible' | 'estado' | 'ultima'>>({ disponible: false, estado: 'desactivada' })
  useEffect(() => {
    cargarDatos()
      .then(({ datos, modo }) => setInicio({ datos, modo, almacenamiento: 'guardado', revision: 0 }))
      .catch(() => setInicio({ datos: datosDemo(), modo: 'demo', almacenamiento: 'memoria', revision: 0 }))
  }, [])

  // Sube y baja cambios: al abrir, cada minuto, al volver a la app y unos segundos después de cada cambio local.
  const guardado = inicio?.almacenamiento === 'guardado'
  const ciclo = useRef<() => Promise<void>>(async () => {})
  useEffect(() => {
    if (!guardado) return
    let vivo = true
    ciclo.current = async () => {
      const estado = await estadoSync()
      if (!estado.activa) {
        const disponible = await servidorDisponible()
        if (vivo) setSync({ disponible, estado: 'desactivada' })
        return
      }
      setSync((s) => ({ ...s, disponible: true, estado: 'sincronizando' }))
      try {
        const cambios = await sincronizarAhora()
        if (cambios && vivo) {
          const { datos, modo } = await cargarDatos()
          setInicio((i) => i && { ...i, datos, modo, revision: i.revision + 1 })
        }
        if (vivo) setSync({ disponible: true, estado: 'ok', ultima: Date.now() })
      } catch {
        if (vivo) setSync((s) => ({ ...s, estado: 'error' }))
      }
    }
    void ciclo.current()
    const reloj = window.setInterval(() => void ciclo.current(), 60_000)
    const visible = () => { if (document.visibilityState === 'visible') void ciclo.current() }
    document.addEventListener('visibilitychange', visible)
    let espera: number | undefined
    const quitar = alCambiarLocal(() => {
      window.clearTimeout(espera)
      espera = window.setTimeout(() => void ciclo.current(), 3000)
    })
    return () => {
      vivo = false
      window.clearInterval(reloj)
      window.clearTimeout(espera)
      document.removeEventListener('visibilitychange', visible)
      quitar()
    }
  }, [guardado])

  const sincronizacion: Sincronizacion = {
    ...sync,
    sincronizar: () => ciclo.current(),
    activar: async () => {
      const candado = await leerCandado()
      if (!candado) throw new Error('sin candado')
      setSync((s) => ({ ...s, estado: 'sincronizando' }))
      await activarSync(candado)
      await ciclo.current()
    },
  }

  if (!inicio) return <div className="grid h-full place-items-center text-muted">…</div>
  return (
    <SyncCtx.Provider value={sincronizacion}>
      <StoreCargado
        key={`${inicio.modo}-${inicio.datos.cursos[0]?.id}-${inicio.revision}`}
        {...inicio}
        onReiniciar={(n) => setInicio((i) => ({ ...n, revision: (i?.revision ?? 0) + 1 }))}
      >
        {children}
      </StoreCargado>
    </SyncCtx.Provider>
  )
}

function StoreCargado({ datos, modo, almacenamiento, onReiniciar, children }: {
  datos: Datos
  modo: 'demo' | 'propio'
  almacenamiento: Store['almacenamiento']
  onReiniciar: (inicio: Omit<Inicio, 'revision'>) => void
  children: ReactNode
}) {
  const guardar = almacenamiento === 'guardado'
  // Siempre hay al menos un curso (si la base no tiene ninguno, se crea uno vacío).
  const [cursos, setCursos] = useState(() => (datos.cursos.length ? datos.cursos : datosVacios().cursos))
  const [alumnos, setAlumnos] = useState(datos.alumnos)
  const [contactos, setContactos] = useState(datos.contactos)
  const [profesionales, setProfesionales] = useState(datos.profesionales)
  const [frases, setFrases] = useState(() =>
    [...datos.frases].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)))
  usePersistir('frases', frases, guardar)
  usePersistir('cursos', cursos, guardar)
  usePersistir('alumnos', alumnos, guardar)
  usePersistir('contactos', contactos, guardar)
  usePersistir('profesionales', profesionales, guardar)
  const curso = cursos.find((c) => c.estado === 'activo') ?? cursos[0]
  // Orden de las listas: el elegido por el tutor; si no hay, número de lista y luego nombre.
  const alumnosActivos = alumnos
    .filter((a) => a.estado === 'activo' && a.cursoId === curso.id)
    .sort((x, y) => (x.orden ?? Infinity) - (y.orden ?? Infinity)
      || (x.numeroLista ?? Infinity) - (y.numeroLista ?? Infinity)
      || `${x.nombre} ${x.apellidos}`.localeCompare(`${y.nombre} ${y.apellidos}`))
  const upsert = <T extends { id: string }>(items: T[], item: T) =>
    items.some((x) => x.id === item.id) ? items.map((x) => (x.id === item.id ? item : x)) : [...items, item]
  const guardarAlumno = (nuevo: Alumno) => {
    // Un alumno nuevo va al final de la lista si ya hay un orden propio.
    const hayOrden = alumnos.some((x) => x.orden !== undefined)
    const a = !alumnos.some((x) => x.id === nuevo.id) && hayOrden && nuevo.orden === undefined
      ? { ...nuevo, orden: Math.max(...alumnos.map((x) => x.orden ?? 0)) + 1 }
      : nuevo
    setAlumnos((items) => upsert(items, a).sort((x, y) => `${x.nombre} ${x.apellidos}`.localeCompare(`${y.nombre} ${y.apellidos}`)))
    // Un grupo nuevo se añade al curso.
    if (a.grupo && !curso.grupos.includes(a.grupo)) {
      setCursos((items) => items.map((c) => (c.id === curso.id ? { ...c, grupos: [...c.grupos, a.grupo] } : c)))
    }
  }
  const importarAlumnado = (nuevos: Alumno[], nuevosContactos: ContactoFamiliar[]) => {
    setAlumnos((items) => [...items, ...nuevos].sort((x, y) => `${x.nombre} ${x.apellidos}`.localeCompare(`${y.nombre} ${y.apellidos}`)))
    setContactos((items) => [...items, ...nuevosContactos])
    const grupos = [...new Set(nuevos.map((a) => a.grupo).filter((g) => g && !curso.grupos.includes(g)))]
    if (grupos.length) setCursos((items) => items.map((c) => (c.id === curso.id ? { ...c, grupos: [...c.grupos, ...grupos] } : c)))
  }
  const guardarCurso = (c: CursoEscolar) => setCursos((items) => upsert(items, c))
  const activarCurso = (id: string) => setCursos((items) => items.map((c) =>
    c.id === id ? { ...c, estado: 'activo' } : c.estado === 'activo' ? { ...c, estado: 'archivado' } : c))
  const ordenarAlumnos = (ids: string[]) => setAlumnos((items) => items.map((a) => {
    const i = ids.indexOf(a.id)
    return i < 0 || a.orden === i ? a : { ...a, orden: i }
  }))
  const moverAlumnos = (ids: string[], cursoId: string, grupo?: string) => {
    setAlumnos((items) => items.map((a) => (ids.includes(a.id) ? { ...a, cursoId, grupo: grupo || a.grupo } : a)))
    if (grupo) setCursos((items) => items.map((c) => (c.id === cursoId && !c.grupos.includes(grupo) ? { ...c, grupos: [...c.grupos, grupo] } : c)))
  }
  // Las frases guardan su posición para conservar el orden elegido.
  const numerar = (items: FraseFrecuente[]) => items.map((f, i) => (f.orden === i ? f : { ...f, orden: i }))
  const guardarFrase = (f: FraseFrecuente) => setFrases((items) => numerar(upsert(items, f)))
  const borrarFrase = (id: string) => setFrases((items) => numerar(items.filter((f) => f.id !== id)))
  const moverFrase = (id: string, delta: -1 | 1) => setFrases((items) => {
    const i = items.findIndex((f) => f.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= items.length) return items
    const copia = [...items]
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
    return numerar(copia)
  })
  const guardarContacto = (c: ContactoFamiliar) => setContactos((items) => upsert(items, c))
  const borrarContacto = (id: string) => setContactos((items) => items.filter((c) => c.id !== id))
  const guardarProfesional = (p: Profesional) => setProfesionales((items) => upsert(items, p))
  const borrarProfesional = (id: string) => setProfesionales((items) => items.filter((p) => p.id !== id))
  const reiniciar = async (nuevo: 'demo' | 'propio') => {
    const nuevos = guardar ? await reiniciarDatos(nuevo) : datosDemo()
    onReiniciar({ datos: nuevos, modo: nuevo, almacenamiento })
  }
  const [documentosClaustre, setDocumentosClaustre] = useState(originalesIncluidos)
  const addDocumentosClaustre = (archivos: File[]) =>
    setDocumentosClaustre((actuales) => [...actuales, ...archivos])
  const [registros, setRegistros] = useState<Registro[]>(datos.registros)
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

  const [acuerdosGuardados, setAcuerdos] = useState<Acuerdo[]>(datos.acuerdos)
  const [ahers, setAhers] = useState<Aher[]>(datos.ahers)
  usePersistir('registros', registros, guardar)
  usePersistir('acuerdos', acuerdosGuardados, guardar)
  usePersistir('ahers', ahers, guardar)

  // App publicada: borra el alumnado de ejemplo que pudiera quedar (también en el servidor y los demás
  // dispositivos, porque los borrados se sincronizan). Las frases de ejemplo se conservan.
  useEffect(() => {
    if (conEjemplo) return
    const demo = idsDemo()
    const fuera = <T extends { id: string }>(c: keyof typeof demo) => (items: T[]) => {
      const quedan = items.filter((x) => !demo[c].has(x.id))
      return quedan.length === items.length ? items : quedan
    }
    setAlumnos(fuera('alumnos'))
    setContactos(fuera('contactos'))
    setProfesionales(fuera('profesionales'))
    setRegistros(fuera('registros'))
    setAcuerdos(fuera('acuerdos'))
    setAhers(fuera('ahers'))
    // El curso de ejemplo se conserva como curso vacío (sus grupos ficticios se quitan).
    setCursos((items) => items.map((c) => (demo.cursos.has(c.id) && c.grupos.includes('4t A')
      ? { ...c, grupos: c.grupos.filter((g) => g !== '4t A') } : c)))
  }, [])
  const addAher: Store['addAher'] = (texto, fecha, detalle) => {
    const id = crypto.randomUUID()
    setAhers((items) => {
      const origen = detalle?.origen
      if (origen && items.some((a) => a.origen?.citaId === origen.citaId && a.origen?.puntoId === origen.puntoId)) return items
      return [{ id, texto, fecha, completado: false, ...detalle }, ...items]
    })
  }
  // Un Ahèr que viene de un acuerdo comparte su id: al completarlo, el acuerdo también se completa.
  const toggleAher = (id: string) => {
    const tarea = ahers.find((item) => item.id === id)
    if (!tarea) return
    setAhers((items) => items.map((item) => item.id === id ? { ...item, completado: !item.completado } : item))
    setAcuerdos((items) => items.map((a) => a.id === id
      ? { ...a, estado: tarea.completado ? 'pendiente' : 'completado' } : a))
  }
  const acuerdos = acuerdosGuardados
  const guardarRegistro = (r: Registro) => setRegistros((items) => upsert(items, r))
  const borrarRegistro = (id: string) => setRegistros((items) => items.filter((r) => r.id !== id))
  // Acuerdo y Ahèr comparten id cuando el acuerdo es del tutor: se mantienen iguales.
  const guardarAcuerdo = (a: Acuerdo) => {
    setAcuerdos((items) => upsert(items, a))
    setAhers((items) => items.map((x) => x.id === a.id
      ? { ...x, texto: a.texto, fecha: a.fechaRevision, completado: a.estado === 'completado' } : x))
  }
  const borrarAcuerdo = (id: string) => {
    setAcuerdos((items) => items.filter((a) => a.id !== id))
    setAhers((items) => items.filter((a) => a.id !== id))
  }
  const guardarAher = (a: Aher) => {
    setAhers((items) => upsert(items, a))
    setAcuerdos((items) => items.map((x) => x.id === a.id
      ? { ...x, texto: a.texto, fechaRevision: a.fecha ?? x.fechaRevision, estado: a.completado ? 'completado' : x.estado === 'completado' ? 'pendiente' : x.estado } : x))
  }
  const borrarAher = (id: string) => borrarAcuerdo(id)
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
        almacenamiento,
        modo,
        reiniciar,
        cursos,
        curso,
        alumnos,
        contactos,
        profesionales,
        frases,
        alumnosActivos,
        guardarAlumno,
        guardarContacto,
        borrarContacto,
        guardarProfesional,
        borrarProfesional,
        importarAlumnado,
        guardarCurso,
        activarCurso,
        moverAlumnos,
        ordenarAlumnos,
        guardarFrase,
        borrarFrase,
        moverFrase,
        guardarRegistro,
        borrarRegistro,
        guardarAcuerdo,
        borrarAcuerdo,
        guardarAher,
        borrarAher,
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
