// Textos de la interfaz. Aranés primero; castellano como segundo idioma.
// IMPORTANTE: los textos en aranés de este prototipo son provisionales y deben
// validarse según la normativa del Institut d'Estudis Aranesi (docs/pendientes.md).
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TipoRegistro } from '../data/types'

export type Lang = 'oc' | 'es'

const oc = {
  inicio: 'Inici',
  reuniones: 'Reunions',
  nuevaReunion: 'Reunion naua',
  pasadas: 'Passades',
  pendientes: 'Pendents',
  hoyYManana: 'Uei e deman',
  ajustes: 'Ajustaments',
  fechaLbl: 'Data',
  horaLbl: 'Ora',
  crear: 'Crear',
  vencido: 'vençut',
  hoy: 'Uei',
  alumnado: 'Alumnat',
  agenda: 'Agenda',
  seguimiento: 'Seguiment',
  capturar: 'Enregistrar',
  nuevoRegistro: 'Registre nau',
  reunionesHoy: 'Reunions de uei e deman',
  acuerdosVencen: 'Acòrds que vencen',
  actasSinFirmar: 'Actes sense signar',
  incidenciasAbiertas: 'Incidéncies dubèrtes',
  teEscotiSeguimiento: 'Te escoti en seguiment',
  sinObservaciones: 'Sense observacions recentes',
  nadaPendiente: 'Arren pendent.',
  hoyTxt: 'uei',
  mananaTxt: 'deman',
  buscar: 'Cercar…',
  cronologia: 'Cronologia',
  datos: 'Donades',
  contactos: 'Contactes',
  documentos: 'Documents',
  evaluacion: 'Avaluacion',
  llamar: 'Trucar',
  escribir: 'Escríuer',
  todos: 'Toti',
  elegirAlumnos: 'Alumnes',
  tipo: 'Tipe',
  texto: 'Tèxte',
  frases: 'Frases frequentes',
  guardar: 'Enregistrar',
  cancelar: 'Anullar',
  sinRegistros: 'Encara non i a registres.',
  proximas: 'Pròximes reunions',
  revisiones: 'Revisions d’acòrds',
  suscripcionIcs: 'Suscripcion .ics (fasa 4)',
  acuerdos: 'Acòrds',
  incidencias: 'Incidéncies',
  pendiente: 'Pendent',
  enSeguimiento: 'En seguiment',
  completado: 'Completat',
  abierto: 'Dubèrt',
  responsable: 'Responsable',
  revision: 'Revision',
  nacimiento: 'Neishement',
  grupo: 'Grop',
  info: 'Informacion rellevanta',
  lengua: 'Lengua',
  preferente: 'Preferent',
  restricciones: 'Restriccions',
  modoReunion: 'Mòde reunion',
  preparar: 'Preparar',
  anotar: 'Anotar',
  acta: 'Acta',
  firmas: 'Signatures',
  pdf: 'PDF',
  anterior: 'Anterior',
  siguiente: 'Seguent',
  ultimaReunion: 'Darrèra reunion',
  observacionesDesde: 'Observacions dempús',
  acuerdosPendientes: 'Acòrds pendents',
  prototipo: 'Prototip · alumnat fictici',
  protegido: 'Protegit',
  reservado: 'Reservat',
  proximamente: 'Disponible en ua fasa mès endauant.',
  idioma: 'Castellano',
  abrirReunion: 'Daurir reunion',
}

type Dict = typeof oc

const es: Dict = {
  inicio: 'Inicio',
  reuniones: 'Reuniones',
  nuevaReunion: 'Nueva reunión',
  pasadas: 'Pasadas',
  pendientes: 'Pendientes',
  hoyYManana: 'Hoy y mañana',
  ajustes: 'Ajustes',
  fechaLbl: 'Fecha',
  horaLbl: 'Hora',
  crear: 'Crear',
  vencido: 'vencido',
  hoy: 'Hoy',
  alumnado: 'Alumnado',
  agenda: 'Agenda',
  seguimiento: 'Seguimiento',
  capturar: 'Registrar',
  nuevoRegistro: 'Nuevo registro',
  reunionesHoy: 'Reuniones de hoy y mañana',
  acuerdosVencen: 'Acuerdos que vencen',
  actasSinFirmar: 'Actas sin firmar',
  incidenciasAbiertas: 'Incidencias abiertas',
  teEscotiSeguimiento: 'Te escoti en seguimiento',
  sinObservaciones: 'Sin observaciones recientes',
  nadaPendiente: 'Nada pendiente.',
  hoyTxt: 'hoy',
  mananaTxt: 'mañana',
  buscar: 'Buscar…',
  cronologia: 'Cronología',
  datos: 'Datos',
  contactos: 'Contactos',
  documentos: 'Documentos',
  evaluacion: 'Evaluación',
  llamar: 'Llamar',
  escribir: 'Escribir',
  todos: 'Todos',
  elegirAlumnos: 'Alumnos',
  tipo: 'Tipo',
  texto: 'Texto',
  frases: 'Frases frecuentes',
  guardar: 'Guardar',
  cancelar: 'Cancelar',
  sinRegistros: 'Todavía no hay registros.',
  proximas: 'Próximas reuniones',
  revisiones: 'Revisiones de acuerdos',
  suscripcionIcs: 'Suscripción .ics (fase 4)',
  acuerdos: 'Acuerdos',
  incidencias: 'Incidencias',
  pendiente: 'Pendiente',
  enSeguimiento: 'En seguimiento',
  completado: 'Completado',
  abierto: 'Abierto',
  responsable: 'Responsable',
  revision: 'Revisión',
  nacimiento: 'Nacimiento',
  grupo: 'Grupo',
  info: 'Información relevante',
  lengua: 'Lengua',
  preferente: 'Preferente',
  restricciones: 'Restricciones',
  modoReunion: 'Modo reunión',
  preparar: 'Preparar',
  anotar: 'Anotar',
  acta: 'Acta',
  firmas: 'Firmas',
  pdf: 'PDF',
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  ultimaReunion: 'Última reunión',
  observacionesDesde: 'Observaciones desde entonces',
  acuerdosPendientes: 'Acuerdos pendientes',
  prototipo: 'Prototipo · alumnado ficticio',
  protegido: 'Protegido',
  reservado: 'Reservado',
  proximamente: 'Disponible en una fase posterior.',
  idioma: 'Aranés',
  abrirReunion: 'Abrir reunión',
}

export const tipoLabel: Record<Lang, Record<TipoRegistro, string>> = {
  oc: {
    observacion: 'Observacion',
    incidencia: 'Incidéncia',
    comunicacion: 'Comunicacion',
    reunionFamilia: 'Reunion damb era familha',
    reunionProfesionales: 'Reunion damb professionaus',
    teEscoti: 'Te escoti',
    evaluacion: 'Avaluacion',
    informe: 'Informe',
  },
  es: {
    observacion: 'Observación',
    incidencia: 'Incidencia',
    comunicacion: 'Comunicación',
    reunionFamilia: 'Reunión con familia',
    reunionProfesionales: 'Reunión con profesionales',
    teEscoti: 'Te escoti',
    evaluacion: 'Evaluación',
    informe: 'Informe',
  },
}

const dicts: Record<Lang, Dict> = { oc, es }

interface Ctx {
  lang: Lang
  t: Dict
  tipo: Record<TipoRegistro, string>
  toggle: () => void
}
const I18nCtx = createContext<Ctx | null>(null)

function readLang(): Lang {
  try {
    return localStorage.getItem('tutoria.lang') === 'es' ? 'es' : 'oc'
  } catch {
    return 'oc'
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readLang)
  const toggle = () =>
    setLang((l) => {
      const next = l === 'oc' ? 'es' : 'oc'
      try {
        localStorage.setItem('tutoria.lang', next)
      } catch {
        /* sin almacenamiento: solo en memoria */
      }
      return next
    })
  return (
    <I18nCtx.Provider value={{ lang, t: dicts[lang], tipo: tipoLabel[lang], toggle }}>
      {children}
    </I18nCtx.Provider>
  )
}

export function useI18n() {
  const c = useContext(I18nCtx)
  if (!c) throw new Error('useI18n fuera de I18nProvider')
  return c
}
