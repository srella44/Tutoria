import { diaLocal } from '../lib/fechas'
// Alumnado FICTICIO para el prototipo (Fase 0). Ningún dato corresponde a personas reales.
// Las fechas se calculan respecto a hoy para que la pantalla «Hoy» siempre tenga contenido.
import type {
  Acuerdo,
  Alumno,
  ContactoFamiliar,
  CursoEscolar,
  FraseFrecuente,
  Profesional,
  Registro,
} from './types'

const dia = (offset: number, hora = '09:00') => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const [h, m] = hora.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const fecha = (offset: number) => diaLocal(dia(offset))

export const curso: CursoEscolar = { id: 'c2627', anyo: '2026-27', grupos: ['4t A'], estado: 'activo' }

const nombres: [string, string, string][] = [
  ['a1', 'Arnau', 'Prova Fictícia'],
  ['a2', 'Bruna', 'Exemple Inventat'],
  ['a3', 'Carla', 'Demo Simulada'],
  ['a4', 'Dídac', 'Fictici Prova'],
  ['a5', 'Elna', 'Inventada Exemple'],
  ['a6', 'Ferran', 'Simulat Demo'],
  ['a7', 'Gala', 'Prova Prova'],
  ['a8', 'Hug', 'Exemple Fictici'],
  ['a9', 'Iona', 'Demo Inventada'],
  ['a10', 'Jan', 'Simulat Prova'],
  ['a11', 'Laia', 'Fictícia Demo'],
  ['a12', 'Marc', 'Inventat Simulat'],
]

export const alumnos: Alumno[] = nombres.map(([id, nombre, apellidos], i) => ({
  id,
  nombre,
  apellidos,
  fechaNacimiento: `2017-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 7) % 27) + 1).padStart(2, '0')}`,
  cursoId: curso.id,
  grupo: '4t A',
  estado: 'activo',
  infoRelevante: id === 'a4' ? 'Plan de suport individuau (fictici).' : undefined,
}))

export const contactos: ContactoFamiliar[] = alumnos.flatMap((a, i) => [
  {
    id: `cf${i}a`,
    alumnoIds: [a.id],
    nombre: `Maire de ${a.nombre}`,
    relacion: 'Maire',
    telefonos: [`600 000 ${String(100 + i)}`],
    correos: [`familia.${a.nombre.toLowerCase()}@example.com`],
    preferente: true,
    lengua: (['oc', 'es', 'ca'] as const)[i % 3],
  },
  {
    id: `cf${i}b`,
    alumnoIds: [a.id],
    nombre: `Pair de ${a.nombre}`,
    relacion: 'Pair',
    telefonos: [`600 000 ${String(200 + i)}`],
    correos: [],
    preferente: false,
    lengua: 'es',
    restricciones: a.id === 'a6' ? 'Custòdia: informacion solament ara maire (fictici).' : undefined,
  },
])

export const profesionales: Profesional[] = [
  { id: 'p1', nombre: 'Professionau EAP (fictici)', rol: 'EAP', servicio: 'EAP Val d’Aran' },
  { id: 'p2', nombre: 'Logopeda (fictici)', rol: 'Logopeda' },
  { id: 'p3', nombre: 'Mentor digitau (fictici)', rol: 'Mentor digitau' },
]

export const registros: Registro[] = [
  { id: 'cla-1', tipo: 'claustro', fecha: dia(-7, '13:00'), alumnoIds: [], texto: '', etiquetas: [], visibilidad: 'reservado', programada: true },
  { id: 'cla-2', tipo: 'ciclo', fecha: dia(3, '13:00'), alumnoIds: [], texto: '', etiquetas: [], visibilidad: 'reservado', programada: true },
  { id: 'cla-3', tipo: 'mentoria', fecha: dia(7, '13:00'), alumnoIds: [], texto: '', etiquetas: [], visibilidad: 'reservado', programada: true },
  { id: 'r1', tipo: 'observacion', fecha: dia(-1, '10:15'), alumnoIds: ['a1'], texto: 'Participe fòrça ena lectura en votz nauta.', etiquetas: ['lectura'], visibilidad: 'normal' },
  { id: 'r2', tipo: 'observacion', fecha: dia(-2, '12:30'), alumnoIds: ['a2', 'a3'], texto: 'Trabalh en parelha fòrça cooperatiu en matematiques.', etiquetas: ['matematiques'], visibilidad: 'normal' },
  { id: 'r3', tipo: 'incidencia', fecha: dia(-3, '11:00'), alumnoIds: ['a4', 'a6'], texto: 'Conflicte ath pati; s’a parlat damb toti dus.', etiquetas: ['convivéncia'], visibilidad: 'normal', estado: 'abierto' },
  { id: 'r4', tipo: 'comunicacion', fecha: dia(-4, '16:45'), alumnoIds: ['a5'], texto: 'Missatge ara familha sus eth material d’arts.', etiquetas: [], visibilidad: 'normal' },
  { id: 'r5', tipo: 'reunionFamilia', fecha: dia(-10, '17:00'), alumnoIds: ['a4'], texto: 'Seguiment deth plan de suport. Acòrds de lectura en casa.', etiquetas: [], visibilidad: 'normal', estado: 'sinFirmar', asistentes: ['cf3a'] },
  { id: 'r6', tipo: 'teEscoti', fecha: dia(-5, '13:00'), alumnoIds: ['a7'], texto: 'Conversa sus ua situacion ath pati.', etiquetas: [], visibilidad: 'protegido', estado: 'abierto' },
  { id: 'r7', tipo: 'reunionFamilia', fecha: dia(0, '17:00'), alumnoIds: ['a2'], texto: 'Reunion de seguiment deth prumèr trimèstre.', etiquetas: [], visibilidad: 'normal', programada: true, asistentes: ['cf1a', 'cf1b'] },
  { id: 'r8', tipo: 'reunionEap', fecha: dia(1, '09:30'), alumnoIds: ['a4', 'a9'], texto: 'Coordinacion damb er EAP.', etiquetas: [], visibilidad: 'reservado', programada: true, asistentes: ['p1'] },
  { id: 'r9', tipo: 'reunionFamilia', fecha: dia(6, '16:30'), alumnoIds: ['a10'], texto: 'Prumèra reunion deth cors.', etiquetas: [], visibilidad: 'normal', programada: true },
  { id: 'r10', tipo: 'observacion', fecha: dia(-20, '10:00'), alumnoIds: ['a8'], texto: 'Mès autonòm enes tasques d’escritura.', etiquetas: ['escritura'], visibilidad: 'normal' },
  { id: 'r11', tipo: 'evaluacion', fecha: dia(-60, '12:00'), alumnoIds: ['a1'], texto: 'Avaluacion inicial: bona comprension lectora.', etiquetas: ['lengua'], visibilidad: 'normal' },
]

export const acuerdos: Acuerdo[] = [
  { id: 'ac1', texto: 'Lectura de 15 minuts cada dia en casa', responsable: 'Familha', fechaRevision: fecha(1), estado: 'seguimiento', registroOrigenId: 'r5', alumnoIds: ['a4'] },
  { id: 'ac2', texto: 'Revisar era agenda cada diuendres', responsable: 'Tutor', fechaRevision: fecha(-1), estado: 'pendiente', registroOrigenId: 'r5', alumnoIds: ['a4'] },
  { id: 'ac3', texto: 'Parlar de nau damb er alumne en ua setmana', responsable: 'Tutor', fechaRevision: fecha(2), estado: 'pendiente', registroOrigenId: 'r6', alumnoIds: ['a7'] },
  { id: 'ac4', texto: 'Material d’arts complet', responsable: 'Familha', fechaRevision: fecha(-8), estado: 'completado', registroOrigenId: 'r4', alumnoIds: ['a5'] },
]

// Frases de ejemplo: PENDIENTES de validación por Sergio (docs/pendientes.md).
export const frases: FraseFrecuente[] = [
  { id: 'f1', texto: 'Participe activament ena classa.', area: 'Generau', tono: 'logro' },
  { id: 'f2', texto: 'A milhorat era sua autonomia en trabalh.', area: 'Generau', tono: 'progreso' },
  { id: 'f3', texto: 'Li còste mantier era atencion.', area: 'Generau', tono: 'dificultad' },
  { id: 'f4', texto: 'Ajude as companhs sense que se li demane.', area: 'Convivéncia', tono: 'logro' },
  { id: 'f5', texto: 'Cau reforçar era lectura en casa.', area: 'Lengua', tono: 'propuesta' },
]
