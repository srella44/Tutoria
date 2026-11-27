# Pendientes

## Validación del aranés (Sergio)

- [x] 2026-11-27: validados y aplicados firmas y actas, PIN y cerradura, sincronización y copias, autorizaciones, horario, ajustes y Aué. Vocabulario unificado en toda la interfaz: carrèu, chifrar, emprenta, papèr, aparelh, emplegar, aplicacion, escafar, enregistrar.
- [x] 2026-11-27 (2.ª tanda): hoja oficial, borrador, citas, puntos, actas, Ahèrs, historial, Google Calendar, banco privado. Criterios: firma/firmes/firmar/firmat (no «signatura»), mercar, enregistrar (datos), triar, descargar, classa, d’auti; «guarda-la» solo para conservar algo físicamente.

Todos los textos en aranés del prototipo son **provisionales** y deben revisarse según la normativa del IEA:

- [x] Etiquetas de interfaz en `src/lib/i18n.tsx` (objeto `oc`), en especial: «Enregistrar» (guardar), «Registre nau», «Donades», «Tipe», «Escríuer», «Trucar», «Neishement», «Pròximes amassades», «Daurir amassada», «Toti», «Inici», «Amassada naua», «Passades», «Pendents», «Ajustaments», «Data», «Ora», «vençut», «Bon dia», «Ahèrs pendents». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar los nuevos textos del calendario, las amassades, Claustre y los Ahèrs, incluidas las formas de los meses. Revisar también «Cercar alumnes». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Nombres de tipos de registro (`tipoLabel.oc`). **Validados por Sergio (27/11/2026)**: «Amassada damb eth logopèda», «Mentoria», «T’escoti», «Avaloracion» (también en la pestaña de la ficha y «T’escoti en seguiment»). Sin tipos nuevos.
- [x] Días de la semana en `src/lib/fechas.ts`. **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Revisar también el aranés de las observaciones, los acuerdos y las fichas ficticias de `src/data/demo.ts`. **Validado por Sergio (27/11/2026) y aplicado** (también el horario de ejemplo).
- [x] Frases frecuentes de ejemplo en `src/data/demo.ts` (sustituir por las validadas del banco de expresiones). **Corregidas por Sergio (27/11/2026)**; las ya guardadas en los aparatos se actualizan solas si no se habían editado.

- [x] Validar «Véder eth calendari» y «Ahèrs vençuts». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar los textos de cursos, frases y orden: «Corses escolars», «Cors nau», «Grops», «Actiu», «Passar er alumnat actiu a aguest cors», «Grop nau entar alumnat (opcionau)», «Frasa naua», «Àrea», «Ton», «Lograt», «Progrès», «Dificultat», «Prepausa», «Pujar», «Baishar», «Fet», «Ordenar per», «Nº de lista». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar «Ora (opcionau)». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar «Barrar», «Tornar a daurir», «Barrada», «Data e ora», «Estat». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar los textos del importador: «Importar alumnat», «Triar fichèr», «Colomnes reconeishudes», «Damb es flèches separes eth nòm des cognòms.», «Ja existís», «Importar tanben es contactes des tutors», «Localitat», «Autorizacion d’imatge», «Non se tròbe ua colomna de nòms», «Non s’a pogut liéger eth fichèr.». **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar los textos de las altas: «Alumne nau», «Nòm», «Cognòms», «Arxivar», «Arxivats», «Tornar a activar», «Contacte nau», «Relacion», «Telefòns», «Corrèus», «Separats per comes», «Tòca un aute còp entà confirmar», «Professionaus», «Professionau nau», «Ròtle», «Servici», «Encara non i a alumnes en aguest cors.», «Castelhan» y las relaciones sugeridas («Tutor legau», «Pairin», «Mairina»). **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Validar los textos de Ajustes › Donades: «Guardat en aguest dispositiu», «Començar sense exemple», «Tornar a cargar er exemple», «Se borraràn totes es donades d’aguest dispositiu.», «Donades pròpies». **Validado por Sergio (27/11/2026) y aplicado.**

- [x] Validar los textos del horario: «Orari», «Session naua», «Matèria», «Jo e era classe», «Solament jo», «Solament era classe», «Jo», «Classe», «Dies», «Ora d’inici», «Ora de fin», «Lòc», «Qui la hè ara classe», «Ara», «Dempús», «enquia», «Setmana», «Aué non i a classes.» y los textos de ayuda. **Validado por Sergio (27/11/2026) y aplicado.**
- [x] Horario: importar desde Excel en cuadrícula.
- [x] Validar «Importar orari», «Sessions liejudes», «Se substituirà er orari actuau…» y la ayuda del importador. **Validado por Sergio (27/11/2026) y aplicado.**

- [x] Validar «Religion», «Hè religion», «Marcar qui hè religion», «Tòca es alumnes que hèn religion», «Marcar ara classe», «Pendents», «Exportar PDF», «Descargar», «Marca es donades que vòs que gessen en PDF…», «Era religion ei ua donada sensibla…». **Validado por Sergio (27/11/2026) y aplicado.**

## Fase 3 · Reuniones (en curso)

- [x] Plantilla oficial guardada una vez y sincronizada; borradores sincronizados (sustituye «Unificar los borradores oficiales con la llave de datos»).
- [x] Modo firma con salida por PIN.
- [x] Acta definitiva bloqueada con versión y huella; versiones nuevas.
- [x] Acta generada por la app para las amassades sin plantilla oficial (profesionales, EAP, logopèda, auta): acta «popurrí» sin firmas, por decisión del tutor (0019).
- [x] Plantilla oficial de reunión con profesionales: no existe; se usa el acta propia «Libreta de classa».
- [x] Convertir los acuerdos del acta en Ahèrs de seguimiento al firmar (se pueden desmarcar; revisión a un mes por defecto).
- [x] Validar: «Mòde signatura», «Signatz enes caselhes…», «Acabar», «Escriu eth PIN de TUTOR-ia entà tornar ara app.», «Signatures hètes…», «Generar er acta definitiva», «Acta signada», «Er acta ei blocada…», «Version», «Version naua», «Empremta», «signat eth», «Manquen signatures…», «Sonque cau triar-la un còp…», «Aguest PDF ei massa gran…».

## Material del centro (anonimizado)

- [x] Plantilla oficial de reunión con familias (PDF recibido)
- [x] Plantilla oficial de reunión con profesionales: no existe en el centro.
- [x] Plantilla oficial de Te escoti (PDF recibido)
- [ ] Actas de ejemplo: no hay antiguas (el tutor estuvo de permiso); hará 2 este curso con la app como prueba.
- [ ] 1 evaluación y 1 informe trimestral de ejemplo, indicando el programa de origen
- [ ] 10–20 informes antiguos anonimizados para el banco de expresiones
- [ ] Confirmar cifrado de extremo a extremo (asumido como sí)

## Fase 0 · lo que queda

- [ ] Probar en el iPhone real (instalar como PWA desde Safari) y anotar ajustes táctiles.
- [ ] Publicar en Cloudflare Pages (`tutoria.pretzhet.app`) detrás de Cloudflare Access.
- [x] Icono PNG 180×180 para `apple-touch-icon` (`public/apple-touch-icon.png`, generado del favicon).

## Fase 2 · Seguridad y sincronización (en curso)

- [x] Cifrado AES-GCM de todos los datos en el dispositivo, PIN, bloqueo automático y clave de recuperación (decisión 0009).
- [x] Un único PIN para todos los dispositivos; unir un aparato con el PIN (decisión 0012). Face ID retirado.
- [x] Validar «Non se pòt contactar damb eth servidor…», «Ja i a ua compte de TUTOR-ia…», «Unir aguest dispositiu ara compte».
- [x] Validar «Escriu eth PIN de TUTOR-ia…», «Encara non se pòt entrar damb eth PIN…», «He desbrembat eth PIN…», «Entrar damb eth PIN».
- [x] Validar «Cifrat damb PIN», «Blocatge automatic sense usatge», «1 ora», «8 ores (tota era jornada)».
- [x] Sincronización cifrada (Pages Functions + D1), probada en local con dos dispositivos (decisión 0010). Dispositivo nuevo con la clave de recuperación.
- [x] Desplegado en Cloudflare: D1 `tutoria`, Pages `tutoria-7y6.pages.dev` desde `main`, Access («Solo Sergio») y comprobación del token en la API.
- [x] Dominio propio `tutoria.pretzhet.app` (Pages › Custom domains) protegido por la misma aplicación de Access.
- [ ] Vincular por QR (opcional: llevaría la clave de recuperación).
- [x] Validar «Sincronizacion», «Activar era sincronizacion», «Sincronizar ara», «Darrèra sincronizacion», «Ja utilizi TUTOR-ia en un aute dispositiu», «Descargant es donades…».
- [x] Copia de seguridad cifrada descargable y restaurable, con prueba de restauración (decisión 0013).
- [x] Validar «Importar autorizacions», «Alumnes reconeishudi», «Non reconeishudi…», «Naua», «Ignorar», «Aplicar a», «Es caselhes vuedes…».
- [x] Validar «Autorizacions», «Autorizacion naua», «Gestionar autorizacions», «Icòna», «Òc», «Non», «A viatges», «Tostemp», «Tres opcions…», «Tòca ua tarja entà cambiar…».
- [x] Validar «Damb» (etiqueta «Damb 4au B» del horario) y la nueva ayuda del Orari: «En cada franja, en gròs çò que hès tu; dejós, mès petit, çò que hè era classe quan non ès damb era».
- [ ] Comprobar en el iPhone que el valor de los campos de fecha y hora queda centrado (ajuste en `src/index.css`).
- [x] Validar «Generau» y «Seguretat» (apartados de la consola de ajustes).
- [x] Validar «Descargar còpia de seguretat», «Restaurar ua còpia», «Darrèra còpia», «Còpia comprovada…», «Aguesta còpia ei d’un aute aparelh…», «Se substituiràn totes es donades…».
- [x] Unificar los borradores oficiales con la llave de datos (Fase 3).
- [x] Validar los textos de la cerradura: «Crea eth tèn PIN», «Repetís eth PIN», «Desblocar», «Clau de recuperacion», «L’è apuntada en paper», «Contunhar», «Massa intents…», «Utilizar era clau de recuperacion», «Blocar ara», «Cambiar eth PIN», «Cifrant es donades…», «Borrar tot e començar de nau».

## Fase 1 · Núcleo local (completada)

- [x] Persistencia en IndexedDB con Dexie (`src/data/db.ts`): registros, acuerdos y Ahèrs se guardan al cambiar; alumnado, contactos, profesionales, cursos y frases se cargan de la base (su edición llega con las altas).
- [x] Altas y edición de alumnos (con archivado), contactos y profesionales. Los alumnos se archivan, no se borran.
- [x] Vista en dos columnas (lista + ficha) desde 1024 px.
- [x] Cursos escolares: crear (con paso del alumnado), editar grupos, cambiar el activo. La promoción por grupos y el archivo de antiguos alumnos siguen en la Fase 6.
- [x] Gestión de frases frecuentes (añadir, editar, borrar, ordenar).
- [x] Orden propio del alumnado (modo Ordenar en Alumnat).
- [x] Documentos del alumno: pestaña «Documents» en la ficha con las actas en PDF y sus versiones (adjuntos sueltos, pendiente).
- [x] Importación del alumnado desde Excel (.xlsx) o CSV, con vista previa (`src/lib/importar.ts`, `src/pages/Importar.tsx`).
- [x] Formularios y diálogos con componentes propios (`src/components/Hoja.tsx`); shadcn/ui no ha hecho falta (ver `docs/decisiones/0002`).
- [x] Editar y cerrar incidencias; editar y borrar registros, acuerdos y Ahèrs.
- [ ] Configurar el cliente OAuth del centro y verificar el acceso real a Google Calendar con una cuenta autorizada.
- [ ] Automatizar el envío ante cambios locales, una vez que existan edición y persistencia de citas.
- [x] Validar las etiquetas de historial, borradores y Ahèrs vinculados en aranés.
- [ ] Desplegar almacenamiento cifrado y autenticado para recuperar el mismo banco y los registros en distintos ordenadores.
- [x] Validar las etiquetas del banco privado y la asignación por alumnado en aranés.
- [ ] Integrar la ayuda de IA únicamente tras implementar y validar el flujo de anonimización y revisión local.
- [x] Validar las etiquetas de la hoja oficial, las firmas y el guardado del borrador en aranés.
- [x] Validar los textos de actas y documentos originales en aranés.
- [x] Validar las etiquetas de estado y de puntos de una cita en aranés.
- [x] Validar «Anotacions», «Tot eth dia» y las abreviaturas de los días en Aué.
- [x] Validar las nuevas etiquetas de Google Calendar, citas personalizadas y alumnado de otros cursos en aranés.
- [x] Validar el nuevo aviso de «Version naua» (firmas conservadas) en aranés.
- [x] Validar «Logo dera escòla» (Cursos) en aranés.
- [x] Validar en aranés el aviso del paso PDF del acta propia («Era acta s’enregistre aciu. Cada PDF nau correspon a ua version naua.»).
- [x] Revisar en un iPhone el PDF «popurrí» generado: título de etiquetadora y tiras de colores, puntos y notas sobre la pauta, Ahèrs, logo, sello y páginas de continuación.
