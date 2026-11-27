# 0017 · Firmas conservadas en versiones nuevas y borrado de actas

**Estado:** aceptada · 2026-11-27 · modifica la 0016

## Contexto
Rehacer las firmas cada vez que se corrige un dato del acta obligaba a volver a reunir a la familia. Además, una cita o
un acta firmada creadas por error no se podían quitar.

## Decisión
- Cambiar campos, motivos o notas de puntos ya no borra las firmas. «Version naua» reabre el acta y conserva las firmas:
  la versión siguiente se genera sin volver a firmar. Cada versión mantiene su sello, fecha y huella; las anteriores se conservan.
- Se puede borrar una versión firmada (doble toque). Si no queda ninguna, la cita deja de estar bloqueada.
- Se puede borrar cualquier cita desde la lista (doble toque), también las firmadas: se borran su borrador y sus actas.
- En la hoja de familia, si la cita tiene puntos preparados, «Aspèctes a tractar» se escribe por punto y el PDF lo compone
  como «1. Punto» + notas. Sin puntos, se mantiene el campo único.

## Consecuencias
Una versión nueva lleva firmas puestas sobre un texto que la familia puede no haber visto: es responsabilidad del tutor
usarlo solo para correcciones. El historial de versiones con huella permite comprobar qué cambió.
