# Funcionalidades

Nombre de la app: **TUTOR-ia** (logo en `docs/marca/`, decisión 0006).

Estado actual: **Fase 1 · Núcleo local** completada. Los datos se guardan en el dispositivo (IndexedDB con Dexie) y sobreviven a recargas. La app publicada empieza vacía; el alumnado ficticio solo se carga en desarrollo y en la vista previa. Los borradores oficiales tienen su propio almacén cifrado.

## Identidad visual

Siempre tema claro: barra lateral y cabeceras blancas, un color de acento y coral para las acciones principales. Logo TUTOR-ia con la «O» como reloj coral (`docs/marca/`); el reloj solo es el icono del navegador y de la PWA. El logo de la barra lateral conduce a Inicio; en la barra inferior, la casa.

## Secciones

Al abrir la app se ve **Inici**: saludo con acceso a Registre nau, próxima reunión, tareas personales con revisión pendiente o vencida y accesos diferenciados por color a Aué, Alumnat, Amassades, Claustre y Seguiment. En móvil, la barra inferior aparece dentro de las secciones.
Al entrar en una sección aparece la barra **Inici (casa) · Alumnat · + · Amassades · Seguiment** (en iPad/ordenador, barra lateral siempre visible).
El engranaje de arriba a la derecha abre la **consola de ajustes** (`/ajustes`), con apartados: Generau (lengua, cursos, frases, profesionales), Seguretat (cifrado, bloqueo automático, cambiar PIN, bloquear), Sincronizacion y Donades (copias de seguridad y borrar los datos del aparato).

| Sección | Ruta | Qué hace hoy |
| --- | --- | --- |
| Inici / Inicio | `/` | Logo, saludo y fecha; tira **Aué** con lo de hoy (amassades y Claustre programados, Ahèrs con fecha de hoy y, si está conectado, eventos de Google Calendar), botón Registre nau y cuatro botones: Alumnat, Amassades, Claustre y Seguiment (aviso rojo si hay Ahèrs vencidos) |
| Aué / Hoy | `/uei` | Calendario mensual con marcas por color para amassades, anotaciones, Ahèrs y eventos de Google. La agenda del día aparece al lado en escritorio y debajo del calendario en móvil |
| Alumnat / Alumnado | `/alumnado` | Cuadrícula o lista del alumnado activo del curso en el orden elegido (modo **Ordenar**: flechas para subir y bajar y atajos por nombre, apellidos o número de lista; el orden se usa en toda la app), búsqueda, **Alumne nau** (nombre, apellidos, nacimiento, grupo, información relevante; un grupo nuevo se añade al curso), filtro de archivados y acceso a Profesionales |
| Importar alumnat | `/importar` | Desde Alumnat (icono de subir) o la lista vacía. Lee Excel (.xlsx) o CSV en el navegador, sin enviar el fichero a ningún sitio. Encuentra la fila de cabeceras y reconoce columnas en aranés, castellano o catalán: número, «Nòm e cognòms» (o nombre y apellidos separados), nacimiento, localidad, grupo, autorización de imagen y correo y teléfono de tutor/tutriz 1 y 2. Vista previa con flechas para separar nombre y apellidos, casillas para excluir filas, aviso de duplicados y de contactos que conviene revisar (texto que no es un correo, correo sin @). Crea los alumnos y, si se quiere, un contacto por tutor (el 1 como preferente) |
| Professionaus / Profesionales | `/profesionales` | Lista de profesionales (nombre, rol, servicio, contacto) con alta, edición y borrado |
| Autorizacions / Autorizaciones | `/autorizaciones` (Ajustes › Generau y desde la ficha) | Lista de autorizaciones para todo el alumnado (nombre e icono), con alta, edición, orden y borrado, y recuento del grupo (sí, a viatges, no, pendiente). Iniciales: Gessuda, Solet y Fòto (òc · non) y Minjador (tostemp · a viatges · non). Cada autorización puede ser de dos o de tres opciones |
| Importar autorizacions | `/autorizaciones/importar` (icono de subir en Autorizacions) | Cualquier Excel o CSV: encuentra la hoja y la columna de nombres comparando con el alumnado (también «Apellidos, Nombre»), detecta las columnas de autorización por su contenido (✓, X, Òc/Sí, Non/No, Tostemp/Siempre, A viatges/A veces) e ignora las demás; empareja cada columna con una autorización existente (Foto/Imatge → Fòto) o propone crearla. Vista previa con recuentos, alumnos no reconocidos y destino editable. Las celdas vacías o «—» no cambian nada |
| Cors escolars / Cursos | `/cursos` (desde Ajustes) | Lista de cursos con su número de alumnos; **Cors nau** crea el curso (pasa a ser el activo y archiva el anterior) y puede pasar el alumnado activo con un grupo nuevo, conservando fichas e historial; editar año y grupos; activar otro curso |
| Frases frequentes | `/frases` (desde Ajustes) | Añadir, editar, borrar y ordenar las frases de la captura rápida (texto, área y tono) |
| Ficha | `/alumnado/:id` | Desde 1024 px de ancho (iPad en horizontal, ordenador), lista del alumnado a la izquierda y ficha a la derecha. Cabecera con grupo, nacimiento e información relevante y botón **Editar** (también archivar, reactivar o **borrar**: se borra con lo que es solo suyo —contactos, registros y acuerdos— y de lo compartido solo se quita); aviso si está archivado; botones llamar, escribir y registrar; **Autorizacions** (tarjetas con icono: verde òc/tostemp, ámbar a viatges, rojo non, gris pendiente; un toque cambia el estado); Contactos con alta, edición y borrado (relación, teléfonos, correos, lengua, preferente único, restricciones); pestañas Cronología (filtrable, con acuerdos), Contactos y Evaluación |
| Amassades / Reuniones | `/reuniones` | Familias, Te escoti, EAP, logopeda y otros profesionales vinculados al alumnado. Próximas y pasadas; permite programar y exportar citas a .ics |
| Claustre / Claustro | `/claustre` | Claustros, sesiones de ciclo y mentoría, sin asociación a alumnado |
| Seguiment / Seguimiento | `/seguimiento` | Ahèrs personales con fecha opcional y casilla de completado; grupos plegables para incidencias, Te escoti, actas sin firmar y tareas de otros responsables |
| Modo reunión | `/reunion/:id` | Asistente a pantalla completa: Preparar, Anotar (conserva notas durante la sesión de uso), Acta (vista previa) y exportación a PDF para sesiones internas. Hojas oficiales (familia y T’escoti): modo firma y acta definitiva bloqueada, con versión y huella (ver «Fase 3»). Las firmas se conservan al editar y al crear una versión nueva; cada versión firmada se puede borrar. Con puntos preparados, «Aspèctes a tractar» de la hoja de familia se escribe por punto. |

En Amassades y Claustre se puede crear una cita con un título propio. Los campos de alta se organizan en bloques plegables y conservan lo introducido al contraerlos. En Te Escoti se pueden añadir participantes de otros cursos por nombre y grupo, incluso sin seleccionar a nadie de la clase del tutor.

Amassades y Claustre agrupan las citas en próximas, pendientes de fechas pasadas y realizadas. El estado se puede cambiar desde la lista o la ficha. Cada cita se puede borrar desde la lista con la papelera (dos toques para confirmar), también las firmadas: se borran su borrador y sus actas. En Preparar, los puntos se escriben o pegan en un único cuadro de texto (p. ej. el orden del día de un correo); en Anotar cada punto numerado (1. … 2. …, aunque vayan seguidos) o cada línea tiene su propia ventana. Los puntos de citas protegidas se reservan para cuando esté disponible el desbloqueo.

En Claustre, Cicle y Mentor, los puntos añadidos en Preparar generan un campo plegable de notas por punto en Anotar. El borrador de acta combina título, fecha, puntos y notas generales. El paso PDF abre la impresión del navegador con un diseño limpio para guardar el acta como PDF.

Claustre permite añadir y recuperar originales DOCX y PDF durante la sesión. La edición privada de la demo puede incluir originales adjuntos sin que formen parte del repositorio o de la edición general.

Las entrevistas con familias y Te Escoti admiten las hojas oficiales originales. Los datos, las marcas y las firmas manuscritas se superponen en sus casillas, conservando el diseño y el número de páginas. Los campos, selecciones y firmas del borrador se guardan automáticamente en IndexedDB con cifrado AES-GCM y se recuperan al reabrir la ficha o recargar en el mismo navegador. Se pueden borrar desde la hoja. Si el navegador bloquea el almacenamiento, el borrador se conserva en memoria mientras la aplicación esté abierta. La edición privada incluye las plantillas; en la edición general se puede seleccionar el PDF original.

## Banco privado de informes

La edición local incluye un banco para importar varios PDF, DOCX, ODT o TXT y etiquetarlos por curso y trimestre. Una lista local de alumnado permite asignar cada archivo cuando su nombre contiene un único nombre y apellidos de la lista. Las coincidencias ambiguas y los archivos sin coincidencia quedan pendientes. También se pueden reasignar manualmente. Los archivos, sus nombres, las etiquetas, la lista de alumnado y las asignaciones se cifran con AES-GCM. La clave se deriva de la frase de acceso con PBKDF2 y vive en memoria mientras el banco está abierto. La edición local bloquea las conexiones de red y la carga de scripts externos mediante CSP.

## Historial y preparación

La ficha del alumno enlaza a su historial de informes en el banco de la edición local. La pestaña Evaluación prepara un borrador editable y descargable a partir de las observaciones seleccionadas. Preparar una amassada muestra las reuniones registradas de ese alumno y da acceso a las actas de años anteriores importadas en el banco. La importación diferencia informes de evaluación y actas de reunión.

Desde las notas de un punto de Claustre o Cicle se puede crear un Ahèr con responsable y fecha. Los propios aparecen en Seguiment y Aué. Los delegados aparecen en el grupo de otros responsables de Seguiment.

## Seguridad (Fase 2)

- Al abrir la app por primera vez se crea un **PIN** de 4 a 8 cifras y se muestra la **clave de recuperación** para apuntarla en papel. Lo que ya hubiera guardado se cifra en ese momento.
- Los datos se guardan cifrados (AES-GCM) en el dispositivo; solo el id de cada fila queda a la vista.
- Cada vez que se abre, la app pide el PIN. Tras 5 fallos, solo se entra con la clave de recuperación (y se crea un PIN nuevo). Sin PIN ni clave, solo queda borrar los datos del dispositivo.
- Recargar la página no pide el PIN mientras la app se haya usado dentro del tiempo de bloqueo. Se bloquea sola tras ese tiempo sin uso (Ajustes › **Blocatge automatic**: 5 min, 15 min, 1 h —por defecto— u 8 h) y desde Ajustes › **Blocar ara**. **Cambiar eth PIN** pide el actual.
- **Un solo PIN para todos los aparatos:** un aparato nuevo entra con el código del correo de Cloudflare y el PIN («Ja utilizi TUTOR-ia en un aute dispositiu»). Si se olvida el PIN, la clave de recuperación (decisión 0012).
- **Copia de seguridad** (Ajustes › Donades): descargar un archivo cifrado y restaurarlo, con prueba previa (decisión 0013).
- Detalles técnicos: `docs/decisiones/0009`.
- **Sincronización** (app publicada en Cloudflare; no en la vista previa): Ajustes › Activar era sincronizacion (pide el PIN; si el servidor ya tiene cuenta, el aparato se une a ella).

## Edición

- Registros de la cronología (observación, incidencia, comunicación…): lápiz para editar texto, tipo, fecha y hora y alumnos, o borrarlo. Las incidencias tienen botón **Barrar / Tornar a daurir** y se marcan como cerradas. Las citas se editan desde su ficha y los registros protegidos esperan al desbloqueo (fase 2).
- Acuerdos (ficha del alumno y Seguiment › otros responsables): texto, responsable, fecha de revisión y estado, o borrarlo.
- Ahèrs (Seguiment): fecha y **hora opcionales** al crearlos y al editarlos (lápiz), o borrarlos. La hora ordena los Ahèrs del día y aparece en Seguiment, en la tira Aué de Inicio y en el calendario. Un Ahèr que viene de un acuerdo del tutor se mantiene sincronizado con él.

## Captura rápida

Botón `+` (central en iPhone, lateral en iPad/ordenador, y en cada ficha con el alumno preseleccionado):
escribir primero, buscar y elegir uno o varios alumnos, elegir el tipo (observación, incidencia, comunicación) y desplegar las frases frecuentes si se necesitan.
El registro aparece al instante en la cronología y, si es incidencia, en «Aué» y «Seguimiento».

## Google Calendar

En la versión web configurada, Aué permite conectar la cuenta escolar y consultar su calendario principal. Las citas de Google se muestran con su origen, sin convertirse en registros de tutoría. En una cita de Tutoria se puede enviar, actualizar o quitar su evento de Google. Solo se envían un título, la hora, una duración de 30 minutos y un identificador de vínculo. Las amassades del alumnado usan un título genérico. Las tareas y las notas permanecen en Tutoria.

Para activar la función, habilita Google Calendar API en un proyecto de Google Cloud y crea un cliente OAuth de tipo aplicación web. Autoriza el origen exacto de la app y compílala con `VITE_GOOGLE_CALENDAR_CLIENT_ID` apuntando al ID público del cliente. El centro puede requerir su aprobación para cuentas de Google Workspace. No se requiere un secreto de cliente. La autorización se conserva en memoria durante la sesión.

## Otros

- Exportación de citas a calendarios compatibles con `.ics` desde las listas o desde una cita. Incluye hora y un título genérico para las amassades del alumnado, sin nombres ni notas.
- Cambio de idioma aranés ⇄ castellano desde Ajustes. Se recuerda en el navegador.
- Vista previa de una sola página: `npm run build:artifact` genera `dist-preview/index.html`.
- Registros protegidos: el texto se oculta (••••••) a la espera del desbloqueo extra de la Fase 2.
- PWA instalable con service worker (actualización automática).
- Siempre tema claro, aunque el sistema esté en modo oscuro.
- Ajustes › Donades: indica si los datos se guardan en el dispositivo y permite borrar los datos de este dispositivo. En la app publicada no hay nada del ejemplo: si quedara alumnado de ejemplo (ids fijos «a1», «r1»…), se borra solo al abrir, también del servidor y de los demás dispositivos. Cargar o quitar el ejemplo solo existe en desarrollo y en la vista previa.

## Orari (horario conjunto)

- Pantalla `/horario` (Inici y barra lateral): en una sola cuadrícula, las sesiones del tutor y las de su clase.
  Formato tabla, como el horario en papel, con el horario del tutor como principal: en cada casilla, en grande lo que hace el tutor (con su clase, etiquetado «Damb 4au B», o en color cuando está en otro sitio) y debajo, en pequeño, lo que hace la clase cuando está con otro maestro. La franja de patio común se pinta como una banda.
- Añadir, editar y borrar sesiones; al crear se pueden marcar varios días a la vez. Tocar un hueco crea una sesión a esa hora.
- iPhone: día a día (hoy por defecto); iPad/ordenador: semana completa. Línea de la hora actual.
- En Inici, la tarjeta «Orari» dice qué toca ahora (y hasta cuándo) o lo siguiente.
- Importar el horario desde Word (.docx), Excel o CSV en cuadrícula (`src/lib/importarHorario.ts`, tablas de Word con `src/lib/leerWord.ts`): fila de días, horas en la primera columna; en cada franja, primera fila = clase y segunda = tutor (vacía = conjunta); una franja con un solo texto (Recreacion) vale para toda la semana. Sustituye el horario del curso activo.
- Cifrado y sincronizado; cada curso escolar tiene su horario (decisión 0014).

## Religión

- Campo `religion` en cada alumno (casilla «Hè religion» al editarlo y etiqueta en la ficha).
- En Alumnat, el botón de la casilla abre «Marcar ara classe»: se elige qué marcar (cada autorización o Religion) y se toca a cada alumno en una lista; las autorizaciones pasan por sus estados como en la ficha, con recuento y «Pendents → Òc» para el resto (`MarcadoRapido` en `src/components/Autorizaciones.tsx`).
- Botón «PDF» en ese modo: se marcan las columnas que se quieren (cada autorización y, si se elige, Religion; por defecto no sale) y se descarga una tabla en color con todo el alumnado, siempre en una sola hoja vertical (filas y letra se ajustan al número de alumnos), generada en el dispositivo con pdf-lib (`src/lib/pdfAutorizaciones.ts`).
- Filtro «Religion · N» en Alumnat para ver solo a quienes la hacen.
- Es un dato sensible: solo existe cifrado (dispositivo y sincronización), nunca en el repositorio.

## Formularios

- Formularios, captura rápida y cita nueva se abren a pantalla completa, con cabecera y pie fijos (decisión 0015).

## Autoría

- Pie «Desvolopat per | logo de Prètzhèt Digitau» con la versión (fecha de publicación, `__VERSION__`) al final de Inici y de Configuracion (`src/components/Creditos.tsx`, logo en `public/pretzhet-digitau.webp`, animación del láser).

## Fase 3 · Actas oficiales (en curso)

- La plantilla oficial (PDF del centro, comprobada por su huella) se elige una sola vez: se guarda cifrada y se sincroniza (colección `plantillas`).
- Los borradores de las hojas pasan a la base principal cifrada y se sincronizan (colección `borradores`); los del almacén antiguo se trasladan solos.
- Modo firma (`src/components/ModoFirma.tsx`): pantalla completa con la vista previa y las casillas de firma; el botón «atrás» no sale y para volver a la app hace falta el PIN.
- Acta definitiva: PDF firmado con sello «TUTOR-ia · Version N · signat eth …» al pie, huella SHA-256 y versión (colección `actas`); la cita queda en estado `firmado` y sus campos bloqueados. «Version naua» la reabre sin borrar las versiones firmadas.
- En la cronología, la etiqueta «Acta signada · vN» descarga el último PDF firmado.
- Límite: un PDF de más de ~1 MB se guarda en el aparato pero no se sincroniza (límite de D1).
