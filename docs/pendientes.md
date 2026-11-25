# Pendientes

## Validación del aranés (Sergio)

Todos los textos en aranés del prototipo son **provisionales** y deben revisarse según la normativa del IEA:

- [ ] Etiquetas de interfaz en `src/lib/i18n.tsx` (objeto `oc`), en especial: «Enregistrar» (guardar), «Registre nau», «Donades», «Tipe», «Escríuer», «Trucar», «Neishement», «Pròximes reunions», «Daurir reunion», «Toti».
- [ ] Nombres de tipos de registro (`tipoLabel.oc`).
- [ ] Días de la semana en `src/lib/fechas.ts`.
- [ ] Frases frecuentes de ejemplo en `src/data/demo.ts` (sustituir por las validadas del banco de expresiones).

## Material del centro (anonimizado)

- [ ] Plantilla oficial de reunión con familias (Word o PDF)
- [ ] Plantilla oficial de reunión con profesionales
- [ ] Plantilla oficial de Te escoti
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
- [ ] Importación CSV del alumnado.
- [ ] Incorporar shadcn/ui para formularios y diálogos (ver `docs/decisiones/0002`).
- [ ] Editar y cerrar incidencias; cambiar estado de acuerdos.
