# 0019 · Acta interna «popurrí»

**Estado:** aceptada · 2026-11-27

## Contexto
Las actas de Claustre, Cicle, Mentoria y otras sesiones no son oficiales: son para uso propio del tutor, que las quiere
menos serias, con color y adornos.

## Decisión
- Diseño elegido por el tutor entre varias propuestas: mezcla de libreta pautada (margen rojo y cinta), post-its, cómic y
  scrapbook.
- Título en mayúsculas con exclamación; fecha y hora y «Mèstre/a» del curso.
- Cada punto es un post-it de color (amarillo, menta, lila, rosa, melocotón) ligeramente girado; las notas van en bocadillo
  y en cursiva. Las notas generales, en un post-it blanco.
- Los Ahèrs creados desde los puntos también van en post-its, con responsable y fecha.
- Sello «OK!» cuando la cita está hecha. Se imprime con color (`print-color-adjust: exact`); los post-its no se parten entre páginas.
- El PDF se genera con pdf-lib (`src/lib/pdfActaPropia.ts`), no con la impresión del navegador, y se guarda en `actas` con versión y huella, sin bloquear la cita. Se usa también en las amassades sin hoja oficial.
- Revisión (2026-11-27): título de etiquetadora (tira negra con letras blancas espaciadas) y fecha y hora, tipo y mèstre/a en tiras de colores; lo redactado va en una tira de papel blanca pegada con cinta de color dentro del post-it (sin bocadillos).
