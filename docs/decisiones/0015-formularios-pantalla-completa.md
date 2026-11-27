# 0015 · Formularios a pantalla completa

**Estado:** aceptada · 2026-11-27

## Contexto
Los formularios (`Hoja`), la captura rápida y la cita nueva se abrían como ventanas flotantes: hoja inferior en el
iPhone y diálogo centrado en iPad/ordenador. En el iPhone se desplazaban con el teclado, la cabecera quedaba fuera de
la vista y algunos campos (fechas) se veían mal.

## Decisión
- Se abren a pantalla completa en todos los dispositivos: cabecera fija (cerrar · título · guardar), contenido con
  desplazamiento propio y pie fijo con las acciones (archivar, borrar, guardar). Respetan las zonas seguras del iPhone.
- En pantallas grandes el contenido se centra con un ancho máximo para que los campos no se estiren.
- Ya no se cierran tocando fuera (no hay fuera): se cierran con la X o con Escape.
