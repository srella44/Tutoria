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
  SesionHorario,
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
  { id: 'r2', tipo: 'observacion', fecha: dia(-2, '12:30'), alumnoIds: ['a2', 'a3'], texto: 'Trabalhe en parelha de manèra cooperativa en matematiques.', etiquetas: ['matematiques'], visibilidad: 'normal' },
  { id: 'r3', tipo: 'incidencia', fecha: dia(-3, '11:00'), alumnoIds: ['a4', 'a6'], texto: 'Conflicte en pati; s’a parlat damb toti dus.', etiquetas: ['convivéncia'], visibilidad: 'normal', estado: 'abierto' },
  { id: 'r4', tipo: 'comunicacion', fecha: dia(-4, '16:45'), alumnoIds: ['a5'], texto: 'Missatge ara familha sus eth materiau de plastica.', etiquetas: [], visibilidad: 'normal' },
  { id: 'r5', tipo: 'reunionFamilia', fecha: dia(-10, '17:00'), alumnoIds: ['a4'], texto: 'Seguiment deth plan de supòrt. Acòrds sus era lectura en casa.', etiquetas: [], visibilidad: 'normal', estado: 'sinFirmar', asistentes: ['cf3a'] },
  { id: 'r6', tipo: 'teEscoti', fecha: dia(-5, '13:00'), alumnoIds: ['a7'], texto: 'Convèrsa sus ua situacion en pati.', etiquetas: [], visibilidad: 'protegido', estado: 'abierto' },
  { id: 'r7', tipo: 'reunionFamilia', fecha: dia(0, '17:00'), alumnoIds: ['a2'], texto: 'Amassada de seguiment deth prumèr trimèstre.', etiquetas: [], visibilidad: 'normal', programada: true, asistentes: ['cf1a', 'cf1b'] },
  { id: 'r8', tipo: 'reunionEap', fecha: dia(1, '09:30'), alumnoIds: ['a4', 'a9'], texto: 'Coordinacion damb er EAP.', etiquetas: [], visibilidad: 'reservado', programada: true, asistentes: ['p1'] },
  { id: 'r9', tipo: 'reunionFamilia', fecha: dia(6, '16:30'), alumnoIds: ['a10'], texto: 'Prumèra amassada deth cors.', etiquetas: [], visibilidad: 'normal', programada: true },
  { id: 'r10', tipo: 'observacion', fecha: dia(-20, '10:00'), alumnoIds: ['a8'], texto: 'Mès autonòm enes tasques d’escritura.', etiquetas: ['escritura'], visibilidad: 'normal' },
  { id: 'r11', tipo: 'evaluacion', fecha: dia(-60, '12:00'), alumnoIds: ['a1'], texto: 'Avaloracion iniciau: bona comprension lectora.', etiquetas: ['lengua'], visibilidad: 'normal' },
]

export const acuerdos: Acuerdo[] = [
  { id: 'ac1', texto: 'Lectura de 15 menutes cada dia en casa', responsable: 'Familha', fechaRevision: fecha(1), estado: 'seguimiento', registroOrigenId: 'r5', alumnoIds: ['a4'] },
  { id: 'ac2', texto: 'Revisar era agenda cada diuendres', responsable: 'Tutor', fechaRevision: fecha(-1), estado: 'pendiente', registroOrigenId: 'r5', alumnoIds: ['a4'] },
  { id: 'ac3', texto: 'Tornar a parlar damb er alumne en ua setmana', responsable: 'Tutor', fechaRevision: fecha(2), estado: 'pendiente', registroOrigenId: 'r6', alumnoIds: ['a7'] },
  { id: 'ac4', texto: 'Portar tot eth materiau de plastica', responsable: 'Familha', fechaRevision: fecha(-8), estado: 'completado', registroOrigenId: 'r4', alumnoIds: ['a5'] },
]

// Frases de ejemplo, validadas por Sergio (27/11/2026).
export const frases: FraseFrecuente[] = [
  { id: 'f1', texto: 'Participe activament ena classe.', area: 'Generau', tono: 'logro' },
  { id: 'f2', texto: 'A melhorat era sua autonomia en trabalh.', area: 'Generau', tono: 'progreso' },
  { id: 'f3', texto: 'Li còste mantier era atencion.', area: 'Generau', tono: 'dificultad' },
  { id: 'f4', texto: 'Ajude as companhs sense que l’ac demanen.', area: 'Convivéncia', tono: 'logro' },
  { id: 'f5', texto: 'Cau reforçar era lectura en casa.', area: 'Lengua', tono: 'propuesta' },
]

// Horario de ejemplo: franjas y materias genéricas (no es el horario real de ningún centro).
const franjas = [['09:00', '10:00'], ['10:00', '11:00'], ['11:00', '11:30'], ['11:30', '12:30'], ['15:00', '16:00'], ['16:00', '17:00']] as const
const plan: [string, SesionHorario['quien'], string?][][] = [
  [['Matematiques', 'conjunta'], ['Lengua aranesa', 'conjunta'], ['Pati', 'conjunta'], ['Anglés', 'clase', 'Especialista d’anglés'], ['Coneishement deth miei', 'conjunta'], ['Educacion fisica', 'clase', 'Especialista d’EF']],
  [['Lengua catalana', 'conjunta'], ['Matematiques', 'conjunta'], ['Pati', 'conjunta'], ['Musica', 'clase', 'Especialista de musica'], ['Lengua castelhana', 'conjunta'], ['Plastica', 'conjunta']],
  [['Matematiques', 'conjunta'], ['Anglés', 'clase', 'Especialista d’anglés'], ['Pati', 'conjunta'], ['Lengua aranesa', 'conjunta'], ['Tutoria', 'conjunta'], ['Coneishement deth miei', 'conjunta']],
  [['Lengua catalana', 'conjunta'], ['Educacion fisica', 'clase', 'Especialista d’EF'], ['Pati', 'conjunta'], ['Matematiques', 'conjunta'], ['Lengua castelhana', 'conjunta'], ['Religion / Valors', 'clase']],
  [['Matematiques', 'conjunta'], ['Lengua aranesa', 'conjunta'], ['Pati', 'conjunta'], ['Coneishement deth miei', 'conjunta'], ['Anglés', 'clase', 'Especialista d’anglés'], ['Musica', 'clase', 'Especialista de musica']],
]
// Mientras la clase está con un especialista, el tutor tiene otras tareas.
const mies: Record<string, string> = { '1-3': 'Reforç 3au', '1-5': 'Coordinacion', '2-3': 'Reforç 5au', '3-1': 'Reforç 3au', '4-1': 'Bibliotèca', '4-5': 'Reforç 5au', '5-4': 'Coordinacion' }
export const horario: SesionHorario[] = plan.flatMap((sesiones, d) => sesiones.flatMap(([materia, quien, docente], f) => {
  const base = { cursoId: curso.id, dia: d + 1, inicio: franjas[f][0], fin: franjas[f][1] }
  const mia = mies[`${d + 1}-${f}`]
  return [
    { ...base, id: `h${d + 1}-${f}`, materia, quien, docente },
    ...(mia ? [{ ...base, id: `h${d + 1}-${f}m`, materia: mia, quien: 'mia' as const }] : []),
  ]
}))
