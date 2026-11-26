# 0006 · Nombre TUTOR-ia, logo y pantalla de inicio

- **Estado:** aceptada
- **Fecha:** 2026-11-26

## Decisión

- La app se llama **TUTOR-ia**. Logo en la línea de «Escòla» (Prètzhèt Digitau): letras de palo blancas o azul noche,
  la «O» es un reloj coral y «-ia» va en coral y minúscula. Firma «BY PRÈTZHÈT DIGITAU». Ficheros en `docs/marca/`;
  en la app, `src/components/MarcaTutoria.tsx` (letras en `currentColor`) y `public/favicon.svg` (icono).
- Inicio responde a dos preguntas: qué tengo hoy (tira Aué, que mezcla Tutoria y Google Calendar) y adónde voy
  (Registre nau y cuatro botones). Un solo color de acento en los botones; el coral queda para acciones.
- En la barra inferior vuelve la casa de Inici en lugar del logo.

## Motivo

«Tutor» es lo principal y la IA ayuda (redactar informes y actas) sin ser el centro. La pantalla anterior tenía
seis bloques de colores y se hacía lenta de leer.
