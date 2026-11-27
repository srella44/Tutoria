# 0018 · Puntos de la cita como texto

**Estado:** aceptada · 2026-11-27

## Contexto
Los órdenes del día de los claustros llegan por correo como lista numerada. Añadirlos uno a uno era lento.

## Decisión
- Preparar muestra un único cuadro de texto. Se guarda tal cual en `Registro.puntosTexto`.
- `puntos` se obtiene del texto con `separarPuntos` (`src/lib/puntos.ts`): por números consecutivos (1. 2. 3), aunque vayan
  seguidos, o una línea por punto. Cada punto conserva su id y sus notas según su posición.
- Anotar (Claustre y hoja de familia) sigue mostrando una ventana por punto. Desaparecen las casillas de «hecho» en Preparar.

## Consecuencias
Si se borra o se intercala un punto en medio, las notas ya escritas quedan asociadas a la posición, no al texto.
