// Altas y edición de alumnado, contactos familiares y profesionales.
import { useState } from 'react'
import { useStore } from '../data/store'
import type { Alumno, ContactoFamiliar, Profesional } from '../data/types'
import { nombreLengua, useI18n } from '../lib/i18n'
import { Campo, claseInput, claseTextarea, Hoja } from './Hoja'

const lista = (texto: string) => texto.split(',').map((x) => x.trim()).filter(Boolean)

/** Botón que pide un segundo toque antes de una acción destructiva (los diálogos del navegador no sirven en la app). */
function BotonConfirmar({ texto, onConfirmar, peligro }: { texto: string; onConfirmar: () => void; peligro?: boolean }) {
  const { t } = useI18n()
  const [armado, setArmado] = useState(false)
  return (
    <button
      type="button"
      onClick={() => (armado ? onConfirmar() : setArmado(true))}
      className={`min-h-10 rounded-xl border px-3 text-sm ${peligro ? 'border-danger text-danger' : 'border-line'} ${armado ? 'bg-danger-soft font-semibold' : ''}`}
    >
      {armado ? t.tocaConfirmar : texto}
    </button>
  )
}

export function FormAlumno({ alumno, onClose }: { alumno?: Alumno; onClose: () => void }) {
  const { t } = useI18n()
  const { curso, guardarAlumno } = useStore()
  const [nombre, setNombre] = useState(alumno?.nombre ?? '')
  const [apellidos, setApellidos] = useState(alumno?.apellidos ?? '')
  const [nacimiento, setNacimiento] = useState(alumno?.fechaNacimiento ?? '')
  const [grupo, setGrupo] = useState(alumno?.grupo ?? curso.grupos[0] ?? '')
  const [info, setInfo] = useState(alumno?.infoRelevante ?? '')
  const ok = nombre.trim() !== '' && apellidos.trim() !== ''

  const guardar = (estado: Alumno['estado'] = alumno?.estado ?? 'activo') => {
    guardarAlumno({
      id: alumno?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      fechaNacimiento: nacimiento,
      cursoId: alumno?.cursoId ?? curso.id,
      grupo: grupo.trim(),
      infoRelevante: info.trim() || undefined,
      estado,
    })
    onClose()
  }

  return (
    <Hoja
      titulo={alumno ? t.editar : t.alumnoNuevo}
      onClose={onClose}
      onGuardar={() => guardar()}
      puedeGuardar={ok}
      pie={alumno && (alumno.estado === 'activo'
        ? <BotonConfirmar texto={t.archivar} onConfirmar={() => guardar('archivado')} />
        : <button type="button" onClick={() => guardar('activo')} className="min-h-10 rounded-xl border border-line px-3 text-sm">{t.reactivar}</button>)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={`${t.nombre} *`}>
          <input autoFocus required value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={`${t.apellidos} *`}>
          <input required value={apellidos} onChange={(e) => setApellidos(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.nacimiento}>
          <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.grupo}>
          <input list="grupos-curso" value={grupo} onChange={(e) => setGrupo(e.target.value)} className={claseInput} />
          <datalist id="grupos-curso">
            {curso.grupos.map((g) => <option key={g} value={g} />)}
          </datalist>
        </Campo>
      </div>
      <Campo label={t.info}>
        <textarea rows={3} value={info} onChange={(e) => setInfo(e.target.value)} className={claseTextarea} />
      </Campo>
    </Hoja>
  )
}

const relaciones = ['Maire', 'Pair', 'Tutor legau', 'Tutora legau', 'Pairin', 'Mairina']

export function FormContacto({ alumnoId, contacto, onClose }: { alumnoId: string; contacto?: ContactoFamiliar; onClose: () => void }) {
  const { t, lang } = useI18n()
  const { guardarContacto, borrarContacto, contactos } = useStore()
  const [nombre, setNombre] = useState(contacto?.nombre ?? '')
  const [relacion, setRelacion] = useState(contacto?.relacion ?? '')
  const [telefonos, setTelefonos] = useState(contacto?.telefonos.join(', ') ?? '')
  const [correos, setCorreos] = useState(contacto?.correos.join(', ') ?? '')
  const [lengua, setLengua] = useState<ContactoFamiliar['lengua']>(contacto?.lengua ?? 'oc')
  const primero = !contactos.some((c) => c.alumnoIds.includes(alumnoId) && c.id !== contacto?.id)
  const [preferente, setPreferente] = useState(contacto?.preferente ?? primero)
  const [restricciones, setRestricciones] = useState(contacto?.restricciones ?? '')
  const ok = nombre.trim() !== ''

  const guardar = () => {
    const id = contacto?.id ?? crypto.randomUUID()
    // Solo un contacto preferente por alumno.
    if (preferente) {
      contactos
        .filter((c) => c.id !== id && c.preferente && c.alumnoIds.includes(alumnoId))
        .forEach((c) => guardarContacto({ ...c, preferente: false }))
    }
    guardarContacto({
      id,
      alumnoIds: contacto?.alumnoIds ?? [alumnoId],
      nombre: nombre.trim(),
      relacion: relacion.trim(),
      telefonos: lista(telefonos),
      correos: lista(correos),
      preferente,
      lengua,
      restricciones: restricciones.trim() || undefined,
    })
    onClose()
  }

  return (
    <Hoja
      titulo={contacto ? t.editar : t.contactoNuevo}
      onClose={onClose}
      onGuardar={guardar}
      puedeGuardar={ok}
      pie={contacto && <BotonConfirmar peligro texto={t.borrar} onConfirmar={() => { borrarContacto(contacto.id); onClose() }} />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={`${t.nombre} *`}>
          <input autoFocus required value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.relacion}>
          <input list="relaciones" value={relacion} onChange={(e) => setRelacion(e.target.value)} className={claseInput} />
          <datalist id="relaciones">{relaciones.map((r) => <option key={r} value={r} />)}</datalist>
        </Campo>
        <Campo label={t.telefonos} ayuda={t.separarComas}>
          <input type="tel" value={telefonos} onChange={(e) => setTelefonos(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.correos} ayuda={t.separarComas}>
          <input type="email" multiple value={correos} onChange={(e) => setCorreos(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.lengua}>
          <select value={lengua} onChange={(e) => setLengua(e.target.value as ContactoFamiliar['lengua'])} className={claseInput}>
            {(['oc', 'es', 'ca', 'fr', 'otra'] as const).map((l) => <option key={l} value={l}>{nombreLengua[lang][l]}</option>)}
          </select>
        </Campo>
        <label className="flex min-h-11 items-center gap-3 self-end">
          <input type="checkbox" checked={preferente} onChange={(e) => setPreferente(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
          <span>{t.preferente}</span>
        </label>
      </div>
      <Campo label={t.restricciones}>
        <textarea rows={2} value={restricciones} onChange={(e) => setRestricciones(e.target.value)} className={claseTextarea} />
      </Campo>
    </Hoja>
  )
}

export function FormProfesional({ profesional, onClose }: { profesional?: Profesional; onClose: () => void }) {
  const { t } = useI18n()
  const { guardarProfesional, borrarProfesional } = useStore()
  const [nombre, setNombre] = useState(profesional?.nombre ?? '')
  const [rol, setRol] = useState(profesional?.rol ?? '')
  const [servicio, setServicio] = useState(profesional?.servicio ?? '')
  const [contacto, setContacto] = useState(profesional?.contacto ?? '')
  const ok = nombre.trim() !== '' && rol.trim() !== ''
  return (
    <Hoja
      titulo={profesional ? t.editar : t.profesionalNuevo}
      onClose={onClose}
      onGuardar={() => {
        guardarProfesional({
          id: profesional?.id ?? crypto.randomUUID(),
          nombre: nombre.trim(),
          rol: rol.trim(),
          servicio: servicio.trim() || undefined,
          contacto: contacto.trim() || undefined,
        })
        onClose()
      }}
      puedeGuardar={ok}
      pie={profesional && <BotonConfirmar peligro texto={t.borrar} onConfirmar={() => { borrarProfesional(profesional.id); onClose() }} />}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={`${t.nombre} *`}>
          <input autoFocus required value={nombre} onChange={(e) => setNombre(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={`${t.rol} *`}>
          <input list="roles" value={rol} onChange={(e) => setRol(e.target.value)} className={claseInput} />
          <datalist id="roles">{['EAP', 'Logopeda', 'Mentor digitau', 'Orientacion', 'Educadora sociau'].map((r) => <option key={r} value={r} />)}</datalist>
        </Campo>
        <Campo label={t.servicio}>
          <input value={servicio} onChange={(e) => setServicio(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.contacto}>
          <input value={contacto} onChange={(e) => setContacto(e.target.value)} className={claseInput} />
        </Campo>
      </div>
    </Hoja>
  )
}
