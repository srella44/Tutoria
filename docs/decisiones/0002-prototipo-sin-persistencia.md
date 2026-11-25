# 0002 · Prototipo (Fase 0) sin persistencia ni shadcn/ui

- **Estado:** aceptada
- **Fecha:** 2026-11-25

## Decisión

La Fase 0 guarda los datos en memoria (`src/data/store.tsx`) con alumnado ficticio, y usa componentes
propios mínimos con Tailwind (`src/components/ui.tsx`) en lugar de shadcn/ui.

## Motivo

- El objetivo de la Fase 0 es validar navegación y diseño táctil en el iPhone, no los datos.
- Las pantallas actuales son casi solo listas; shadcn/ui aporta valor con formularios y diálogos,
  que llegan en la Fase 1 junto con Dexie.

## Consecuencias

- Recargar la página devuelve el estado de demostración.
- En la Fase 1 se sustituye el store por Dexie manteniendo la misma interfaz `useStore()`.
