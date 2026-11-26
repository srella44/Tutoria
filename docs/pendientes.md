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

## Fase 1 · Núcleo local (siguiente)

- [ ] Persistencia en IndexedDB con Dexie (sustituir `src/data/store.tsx`).
- [ ] Altas y edición de alumnos, contactos y profesionales.
- [ ] Vista en dos columnas (lista + ficha) en iPad y ordenador.
- [ ] Cursos escolares (crear, cambiar de curso activo).
- [ ] Gestión de frases frecuentes.
- [ ] Documentos del alumno (actas firmadas, adjuntos) dentro de la ficha; hoy no hay pestaña propia.
- [ ] Importación CSV del alumnado.
- [ ] Incorporar shadcn/ui para formularios y diálogos (ver `docs/decisiones/0002`).
- [ ] Editar y cerrar incidencias.
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
