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
  completado: boolean
  responsable?: string
  origen?: { citaId: Id; puntoId: Id }
}

export function citaRealizada(cita: Registro) {
  return cita.realizada ?? !cita.programada
}
