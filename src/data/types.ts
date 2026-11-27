// Modelo de datos de Tutoria. Ver docs/funcionalidades.md, sección «Modelo de datos».
// Todo lo que ocurre con un alumno es un Registro con tipo.

export type Id = string
export type IsoDate = string // YYYY-MM-DD o ISO completo con hora

export interface CursoEscolar {
  id: Id
  anyo: string // «2026-27»
  grupos: string[]
  estado: 'activo' | 'archivado'
}

export interface Alumno {
  id: Id
  nombre: string
  apellidos: string
  fechaNacimiento: IsoDate
  cursoId: Id
  grupo: string
  infoRelevante?: string
  localidad?: string
  /** Antiguo (importador): se pasa a `autorizaciones.foto`. */
  autorizacionImagen?: boolean
  /** Estado de cada autorización, por id de TipoAutorizacion. Sin valor = pendiente. */
  autorizaciones?: Record<string, EstadoAutorizacion>
  /** Número de lista del curso (importado). */
  numeroLista?: number
  /** Hace Religión (si no, Valores). Dato sensible: solo cifrado en el dispositivo y en la sincronización. */
  religion?: boolean
  /** Posición elegida por el tutor en las listas (menor primero). */
  orden?: number
  estado: 'activo' | 'archivado'
}

export interface ContactoFamiliar {
  id: Id
  alumnoIds: Id[]
  nombre: string
  relacion: string // maire, pair, tutor legau…
  telefonos: string[]
  correos: string[]
  preferente: boolean
  lengua: 'oc' | 'es' | 'ca' | 'fr' | 'otra'
  restricciones?: string
}

export interface Profesional {
  id: Id
  nombre: string
  rol: string // EAP, logopeda, mentor digital…
  servicio?: string
  contacto?: string
}

export type TipoRegistro =
  | 'observacion'
  | 'incidencia'
  | 'comunicacion'
  | 'reunionFamilia'
  | 'reunionProfesionales'
  | 'reunionEap'
  | 'reunionLogopeda'
  | 'claustro'
  | 'ciclo'
  | 'mentoria'
  | 'otraAmassada'
  | 'otroClaustre'
  | 'teEscoti'
  | 'evaluacion'
  | 'informe'

export type Visibilidad = 'normal' | 'reservado' | 'protegido'

export interface Registro {
  id: Id
  tipo: TipoRegistro
  fecha: IsoDate // con hora
  alumnoIds: Id[]
  texto: string
  etiquetas: string[]
  visibilidad: Visibilidad
  estado?: 'abierto' | 'cerrado' | 'borrador' | 'sinFirmar' | 'firmado'
  asistentes?: Id[] // contactos y profesionales
  realizada?: boolean
  puntos?: { id: Id; texto: string; hecho: boolean; notas?: string }[]
  titulo?: string
  alumnosOtrosCursos?: { nombre: string; curso: string }[]
  programada?: boolean // reunión futura
}

export type EstadoAcuerdo = 'pendiente' | 'seguimiento' | 'completado'

export interface Acuerdo {
  id: Id
  texto: string
  responsable: string
  fechaRevision: IsoDate
  estado: EstadoAcuerdo
  registroOrigenId: Id
  alumnoIds: Id[]
}

export interface FraseFrecuente {
  id: Id
  texto: string
  area: string
  tono: 'logro' | 'progreso' | 'dificultad' | 'propuesta'
  /** Posición en la lista (las frases se muestran en este orden). */
  orden?: number
}

export const tiposAmassada = ['reunionFamilia', 'teEscoti', 'reunionEap', 'reunionLogopeda', 'reunionProfesionales', 'otraAmassada'] as const
export const tiposClaustre = ['claustro', 'ciclo', 'mentoria', 'otroClaustre'] as const

export function esClaustre(tipo: TipoRegistro) {
  return tiposClaustre.some((item) => item === tipo)
}

export interface Aher {
  id: Id
  texto: string
  fecha?: IsoDate
  /** Hora opcional (HH:MM) dentro del día de la fecha. */
  hora?: string
  completado: boolean
  responsable?: string
  origen?: { citaId: Id; puntoId: Id }
}

export function citaRealizada(cita: Registro) {
  return cita.realizada ?? !cita.programada
}

export type EstadoAutorizacion = 'si' | 'aviatges' | 'no'

/** Autorización que se controla para todo el alumnado (la lista la decide el tutor). */
export interface TipoAutorizacion {
  id: Id
  nombre: string
  /** Nombre de un icono de la lista ICONOS_AUTORIZACION. */
  icono: string
  orden: number
  /** Tres opciones (Tostemp · A viatges · Non) en lugar de dos (Òc · Non). */
  tresEstados?: boolean
}

/** Para quién es una sesión del horario: los dos (yo con mi clase), solo yo, o solo la clase (con otro maestro). */
export type QuienHorario = 'conjunta' | 'mia' | 'clase'

/** Sesión semanal del horario conjunto (el del tutor y el de su clase en una sola cuadrícula). */
export interface SesionHorario {
  id: Id
  cursoId: Id
  /** 1 = lunes … 5 = viernes. */
  dia: number
  inicio: string // HH:MM
  fin: string // HH:MM
  materia: string
  quien: QuienHorario
  lugar?: string
  /** Quién da la sesión a la clase cuando no es el tutor. */
  docente?: string
  nota?: string
}

/** Borrador de una hoja oficial (id = id de la cita). */
export interface BorradorActa {
  id: Id
  valores: Record<string, string>
  motivos: number[]
  /** Firmas manuscritas (PNG en data URL), por casilla de la plantilla. */
  firmas: (string | null)[]
}

/** PDF original de una plantilla oficial del centro (se elige una vez y queda guardado). */
export interface PlantillaOficial {
  id: 'familia' | 'escoti'
  nombre: string
  /** PDF en base64. */
  pdf: string
}

/** Acta definitiva: PDF firmado y bloqueado. Cada cambio posterior crea una versión nueva. */
export interface ActaFirmada {
  id: Id
  registroId: Id
  version: number
  /** Fecha y hora de la firma (ISO). */
  fecha: string
  /** Huella SHA-256 del PDF (hex). */
  huella: string
  firmantes: string[]
  nombre: string
  /** PDF en base64. */
  pdf: string
}
