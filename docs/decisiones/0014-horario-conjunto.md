# 0014 · Horario conjunto (tutor + clase)

**Estado:** aceptada · 2026-11-27

## Contexto
El tutor consulta un único horario en el que conviven sus sesiones y las de su clase: muchas franjas las comparten,
pero cuando la clase está con un especialista el tutor tiene otra tarea (refuerzo, coordinación…).

## Decisión
- Nueva colección `horario` (`SesionHorario`): `dia` (1–5), `inicio`/`fin` (HH:MM), `materia`, `quien`
  (`conjunta` · `mia` · `clase`), `docente` y `lugar` opcionales, `cursoId` (cada curso tiene su horario).
- Se cifra y sincroniza como el resto (Dexie v4, tabla añadida a `functions/api/sync.ts`).
- (Revisado) Vista en tabla como el horario en papel: una fila por franja; en cada casilla, arriba lo de la clase y debajo, en color, lo del tutor cuando no está con ella. Antes: vista a escala de tiempo, con la del tutor a la izquierda (borde
  discontinuo) y a la derecha la de la clase. Color estable por materia. Línea roja en la hora actual.
- iPhone: un día cada vez con pestañas; iPad/ordenador: la semana entera. En Inici, «Ara / Dempús».
- En producción empieza vacío; el horario de ejemplo (genérico) solo existe en desarrollo.

## Consecuencias
Las franjas no tienen que coincidir entre días ni entre tutor y clase. Se importa desde Excel en cuadrícula (clase arriba, tutor abajo en cada franja).
