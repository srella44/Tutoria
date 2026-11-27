// Altas y edición de alumnado, contactos familiares y profesionales.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../data/store'
import type { Acuerdo, Aher, Alumno, ContactoFamiliar, EstadoAcuerdo, Profesional, Registro } from '../data/types'
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
  const { curso, guardarAlumno, borrarAlumno } = useStore()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState(alumno?.nombre ?? '')
  const [apellidos, setApellidos] = useState(alumno?.apellidos ?? '')
  const [nacimiento, setNacimiento] = useState(alumno?.fechaNacimiento ?? '')
  const [grupo, setGrupo] = useState(alumno?.grupo ?? curso.grupos[0] ?? '')
  const [info, setInfo] = useState(alumno?.infoRelevante ?? '')
  const [localidad, setLocalidad] = useState(alumno?.localidad ?? '')
  const [religion, setReligion] = useState(alumno?.religion ?? false)
  const ok = nombre.trim() !== '' && apellidos.trim() !== ''

  const guardar = (estado: Alumno['estado'] = alumno?.estado ?? 'activo') => {
    guardarAlumno({
      ...alumno,
      id: alumno?.id ?? crypto.randomUUID(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      fechaNacimiento: nacimiento,
      cursoId: alumno?.cursoId ?? curso.id,
      grupo: grupo.trim(),
      infoRelevante: info.trim() || undefined,
      localidad: localidad.trim() || undefined,
      autorizaciones: alumno?.autorizaciones,
      numeroLista: alumno?.numeroLista,
      religion: religion || undefined,
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
      pie={alumno && (
        <>
          {alumno.estado === 'activo'
            ? <BotonConfirmar texto={t.archivar} onConfirmar={() => guardar('archivado')} />
            : <button type="button" onClick={() => guardar('activo')} className="min-h-10 rounded-xl border border-line px-3 text-sm">{t.reactivar}</button>}
          <BotonConfirmar peligro texto={t.borrar} onConfirmar={() => { borrarAlumno(alumno.id); onClose(); navigate('/alumnado') }} />
        </>
      )}
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
        <Campo label={t.localidad}>
          <input value={localidad} onChange={(e) => setLocalidad(e.target.value)} className={claseInput} />
        </Campo>
      </div>
      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3">
        <input type="checkbox" checked={religion} onChange={(e) => setReligion(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
        <span>{t.haceReligion}</span>
      </label>
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

const tiposEditables = ['observacion', 'incidencia', 'comunicacion'] as const
const aLocal = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Editar un registro de la cronología (observación, incidencia, comunicación…). */
export function FormRegistro({ registro, onClose }: { registro: Registro; onClose: () => void }) {
  const { t, tipo: tipoLabel } = useI18n()
  const { alumnosActivos, alumnos, guardarRegistro, borrarRegistro } = useStore()
  const [tipo, setTipo] = useState(registro.tipo)
  const [texto, setTexto] = useState(registro.texto)
  const [fecha, setFecha] = useState(aLocal(registro.fecha))
  const [sel, setSel] = useState(registro.alumnoIds)
  const [estado, setEstado] = useState(registro.estado)
  // Los alumnos ya vinculados se muestran aunque estén archivados.
  const elegibles = [...alumnosActivos, ...alumnos.filter((a) => sel.includes(a.id) && !alumnosActivos.includes(a))]
  const ok = texto.trim() !== '' && sel.length > 0 && fecha !== ''
  const conmutar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <Hoja
      titulo={t.editar}
      onClose={onClose}
      puedeGuardar={ok}
      onGuardar={() => {
        guardarRegistro({
          ...registro,
          tipo,
          texto: texto.trim(),
          fecha: new Date(fecha).toISOString(),
          alumnoIds: sel,
          estado: tipo === 'incidencia' ? (estado ?? 'abierto') : registro.tipo === 'incidencia' ? undefined : estado,
        })
        onClose()
      }}
      pie={<BotonConfirmar peligro texto={t.borrar} onConfirmar={() => { borrarRegistro(registro.id); onClose() }} />}
    >
      {(tiposEditables as readonly string[]).includes(registro.tipo) && (
        <div className="grid grid-cols-3 gap-2">
          {tiposEditables.map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTipo(tp)}
              className={`min-h-11 rounded-xl border px-2 text-sm ${tipo === tp ? 'border-accent bg-accent-soft font-semibold text-accent' : 'border-line'}`}
            >
              {tipoLabel[tp]}
            </button>
          ))}
        </div>
      )}
      <Campo label={t.texto}>
        <textarea autoFocus rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} className={claseTextarea} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={t.fechaYHora}>
          <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} className={claseInput} />
        </Campo>
        {tipo === 'incidencia' && (
          <Campo label={t.estado}>
            <select value={estado ?? 'abierto'} onChange={(e) => setEstado(e.target.value as Registro['estado'])} className={claseInput}>
              <option value="abierto">{t.abierto}</option>
              <option value="cerrado">{t.cerrada}</option>
            </select>
          </Campo>
        )}
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase text-muted">{t.elegirAlumnos} · {sel.length}</legend>
        <div className="flex flex-wrap gap-2">
          {elegibles.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => conmutar(a.id)}
              className={`min-h-10 rounded-full border px-3.5 text-[15px] ${sel.includes(a.id) ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}
            >
              {a.nombre}
            </button>
          ))}
        </div>
      </fieldset>
    </Hoja>
  )
}

/** Editar un acuerdo (texto, responsable, revisión y estado). */
export function FormAcuerdo({ acuerdo, onClose }: { acuerdo: Acuerdo; onClose: () => void }) {
  const { t } = useI18n()
  const { guardarAcuerdo, borrarAcuerdo } = useStore()
  const [texto, setTexto] = useState(acuerdo.texto)
  const [responsable, setResponsable] = useState(acuerdo.responsable)
  const [fecha, setFecha] = useState(acuerdo.fechaRevision)
  const [estado, setEstado] = useState(acuerdo.estado)
  const etiquetas: Record<EstadoAcuerdo, string> = { pendiente: t.pendiente, seguimiento: t.enSeguimiento, completado: t.completado }
  return (
    <Hoja
      titulo={t.editar}
      onClose={onClose}
      puedeGuardar={texto.trim() !== ''}
      onGuardar={() => {
        guardarAcuerdo({ ...acuerdo, texto: texto.trim(), responsable: responsable.trim(), fechaRevision: fecha, estado })
        onClose()
      }}
      pie={<BotonConfirmar peligro texto={t.borrar} onConfirmar={() => { borrarAcuerdo(acuerdo.id); onClose() }} />}
    >
      <Campo label={t.texto}>
        <textarea autoFocus rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} className={claseTextarea} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label={t.responsable}>
          <input list="responsables" value={responsable} onChange={(e) => setResponsable(e.target.value)} className={claseInput} />
          <datalist id="responsables">{['Tutor', 'Familha', 'EAP'].map((r) => <option key={r} value={r} />)}</datalist>
        </Campo>
        <Campo label={t.revision}>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.estado}>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoAcuerdo)} className={claseInput}>
            {(Object.keys(etiquetas) as EstadoAcuerdo[]).map((k) => <option key={k} value={k}>{etiquetas[k]}</option>)}
          </select>
        </Campo>
      </div>
    </Hoja>
  )
}

/** Editar un Ahèr (tarea personal o delegada). */
export function FormAher({ aher, onClose }: { aher: Aher; onClose: () => void }) {
  const { t } = useI18n()
  const { guardarAher, borrarAher } = useStore()
  const [texto, setTexto] = useState(aher.texto)
  const [fecha, setFecha] = useState(aher.fecha ?? '')
  const [hora, setHora] = useState(aher.hora ?? '')
  return (
    <Hoja
      titulo={t.editar}
      onClose={onClose}
      puedeGuardar={texto.trim() !== ''}
      onGuardar={() => {
        guardarAher({ ...aher, texto: texto.trim(), fecha: fecha || undefined, hora: fecha && hora ? hora : undefined })
        onClose()
      }}
      pie={<BotonConfirmar peligro texto={t.borrar} onConfirmar={() => { borrarAher(aher.id); onClose() }} />}
    >
      <Campo label={t.texto}>
        <textarea autoFocus rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} className={claseTextarea} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label={t.fechaTarea}>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={claseInput} />
        </Campo>
        <Campo label={t.horaOpcional}>
          <input type="time" value={hora} disabled={!fecha} onChange={(e) => setHora(e.target.value)} className={`${claseInput} disabled:opacity-40`} />
        </Campo>
      </div>
    </Hoja>
  )
}
