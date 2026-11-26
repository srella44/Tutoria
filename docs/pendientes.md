# Pendientes

## Validación del aranés (Sergio)

Todos los textos en aranés del prototipo son **provisionales** y deben revisarse según la normativa del IEA:

- [ ] Etiquetas de interfaz en `src/lib/i18n.tsx` (objeto `oc`), en especial: «Enregistrar» (guardar), «Registre nau», «Donades», «Tipe», «Escríuer», «Trucar», «Neishement», «Pròximes amassades», «Daurir amassada», «Toti», «Inici», «Amassada naua», «Passades», «Pendents», «Ajustaments», «Data», «Ora», «vençut», «Bon dia», «Ahèrs pendents».
- [ ] Validar los nuevos textos del calendario, las amassades, Claustre y los Ahèrs, incluidas las formas de los meses. Revisar también «Cercar alumnes».
- [ ] Nombres de tipos de registro (`tipoLabel.oc`).
- [ ] Días de la semana en `src/lib/fechas.ts`.
- [ ] Revisar también el aranés de las observaciones, los acuerdos y las fichas ficticias de `src/data/demo.ts`.
- [ ] Frases frecuentes de ejemplo en `src/data/demo.ts` (sustituir por las validadas del banco de expresiones).

- [ ] Validar «Véder eth calendari» y «Ahèrs vençuts».
- [ ] Validar los textos de cursos, frases y orden: «Corses escolars», «Cors nau», «Grops», «Actiu», «Passar er alumnat actiu a aguest cors», «Grop nau entar alumnat (opcionau)», «Frasa naua», «Àrea», «Ton», «Lograt», «Progrès», «Dificultat», «Prepausa», «Pujar», «Baishar», «Fet», «Ordenar per», «Nº de lista».
- [ ] Validar «Ora (opcionau)».
- [ ] Validar «Barrar», «Tornar a daurir», «Barrada», «Data e ora», «Estat».
- [ ] Validar los textos del importador: «Importar alumnat», «Triar fichèr», «Colomnes reconeishudes», «Damb es flèches separes eth nòm des cognòms.», «Ja existís», «Importar tanben es contactes des tutors», «Localitat», «Autorizacion d’imatge», «Non se tròbe ua colomna de nòms», «Non s’a pogut liéger eth fichèr.».
- [ ] Validar los textos de las altas: «Alumne nau», «Nòm», «Cognòms», «Arxivar», «Arxivats», «Tornar a activar», «Contacte nau», «Relacion», «Telefòns», «Corrèus», «Separats per comes», «Tòca un aute còp entà confirmar», «Professionaus», «Professionau nau», «Ròtle», «Servici», «Encara non i a alumnes en aguest cors.», «Castelhan» y las relaciones sugeridas («Tutor legau», «Pairin», «Mairina»).
- [ ] Validar los textos de Ajustes › Donades: «Guardat en aguest dispositiu», «Començar sense exemple», «Tornar a cargar er exemple», «Se borraràn totes es donades d’aguest dispositiu.», «Donades pròpies».

## Material del centro (anonimizado)

- [x] Plantilla oficial de reunión con familias (PDF recibido)
- [ ] Plantilla oficial de reunión con profesionales
- [x] Plantilla oficial de Te escoti (PDF recibido)
- [ ] 3–4 actas antiguas anonimizadas de cada tipo
- [ ] 1 evaluación y 1 informe trimestral de ejemplo, indicando el programa de origen
- [ ] 10–20 informes antiguos anonimizados para el banco de expresiones
- [ ] Confirmar cifrado de extremo a extremo (asumido como sí)

## Fase 0 · lo que queda

- [ ] Probar en el iPhone real (instalar como PWA desde Safari) y anotar ajustes táctiles.
- [ ] Publicar en Cloudflare Pages (`tutoria.pretzhet.app`) detrás de Cloudflare Access.
- [ ] Icono PNG 180×180 para `apple-touch-icon` (iOS no usa el SVG del manifiesto).

## Fase 2 · Seguridad y sincronización (en curso)

- [x] Cifrado AES-GCM de todos los datos en el dispositivo, PIN, bloqueo automático y clave de recuperación (decisión 0009).
- [ ] Passkey con Face ID / Touch ID (WebAuthn PRF).
- [x] Sincronización cifrada (Pages Functions + D1), probada en local con dos dispositivos (decisión 0010). Dispositivo nuevo con la clave de recuperación.
- [ ] Desplegar en Cloudflare (`docs/despliegue.md`): D1, Pages, dominio `tutoria.pretzhet.app` y Access.
- [ ] Vincular por QR (opcional: llevaría la clave de recuperación).
- [ ] Validar «Sincronizacion», «Activar era sincronizacion», «Sincronizar ara», «Darrèra sincronizacion», «Ja utilizi TUTOR-ia en un aute dispositiu», «Descargant es donades…».
- [ ] Copia de seguridad cifrada mensual y prueba de restauración.
- [ ] Unificar los borradores oficiales con la llave de datos.
- [ ] Validar los textos de la cerradura: «Crea eth tèn PIN», «Repetís eth PIN», «Desblocar», «Clau de recuperacion», «L’è apuntada en paper», «Contunhar», «Massa intents…», «Utilizar era clau de recuperacion», «Blocar ara», «Cambiar eth PIN», «Cifrant es donades…», «Borrar tot e començar de nau».

## Fase 1 · Núcleo local (completada)

- [x] Persistencia en IndexedDB con Dexie (`src/data/db.ts`): registros, acuerdos y Ahèrs se guardan al cambiar; alumnado, contactos, profesionales, cursos y frases se cargan de la base (su edición llega con las altas).
- [x] Altas y edición de alumnos (con archivado), contactos y profesionales. Los alumnos se archivan, no se borran.
- [x] Vista en dos columnas (lista + ficha) desde 1024 px.
- [x] Cursos escolares: crear (con paso del alumnado), editar grupos, cambiar el activo. La promoción por grupos y el archivo de antiguos alumnos siguen en la Fase 6.
- [x] Gestión de frases frecuentes (añadir, editar, borrar, ordenar).
- [x] Orden propio del alumnado (modo Ordenar en Alumnat).
- [ ] Documentos del alumno (actas firmadas, adjuntos) dentro de la ficha; hoy no hay pestaña propia.
- [x] Importación del alumnado desde Excel (.xlsx) o CSV, con vista previa (`src/lib/importar.ts`, `src/pages/Importar.tsx`).
- [x] Formularios y diálogos con componentes propios (`src/components/Hoja.tsx`); shadcn/ui no ha hecho falta (ver `docs/decisiones/0002`).
- [x] Editar y cerrar incidencias; editar y borrar registros, acuerdos y Ahèrs.
- [ ] Configurar el cliente OAuth del centro y verificar el acceso real a Google Calendar con una cuenta autorizada.
- [ ] Automatizar el envío ante cambios locales, una vez que existan edición y persistencia de citas.
- [ ] Validar las etiquetas de historial, borradores y Ahèrs vinculados en aranés.
- [ ] Desplegar almacenamiento cifrado y autenticado para recuperar el mismo banco y los registros en distintos ordenadores.
- [ ] Validar las etiquetas del banco privado y la asignación por alumnado en aranés.
- [ ] Integrar la ayuda de IA únicamente tras implementar y validar el flujo de anonimización y revisión local.
- [ ] Validar las etiquetas de la hoja oficial, las firmas y el guardado del borrador en aranés.
- [ ] Validar los textos de actas y documentos originales en aranés.
- [ ] Validar las etiquetas de estado y de puntos de una cita en aranés.
- [ ] Validar «Anotacions», «Tot eth dia» y las abreviaturas de los días en Aué.
- [ ] Validar las nuevas etiquetas de Google Calendar, citas personalizadas y alumnado de otros cursos en aranés.
