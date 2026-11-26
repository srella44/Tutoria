# 0008 · Persistencia local con Dexie

- **Estado:** aceptada
- **Fecha:** 2026-11-26

## Decisión

Los datos se guardan en IndexedDB mediante Dexie (`src/data/db.ts`), en una base `tutoria` con una tabla por
colección (cursos, alumnos, contactos, profesionales, registros, acuerdos, Ahèrs, frases) y `meta` para el modo.

- El store mantiene la misma interfaz `useStore()`. Carga todo al abrir y, en cada cambio de una colección,
  guarda solo lo nuevo o modificado y borra lo que ya no está (`sincronizar`).
- La primera vez se carga el alumnado ficticio (`modo: demo`). Desde Ajustes se puede empezar sin ejemplo
  (`modo: propio`, curso vacío) o volver al ejemplo, con confirmación.
- Si el navegador bloquea IndexedDB, la app funciona en memoria con el ejemplo y lo avisa en Ajustes.

## Consecuencias

- Los datos todavía no están cifrados. Siguen valiendo las reglas: datos reales solo tras la Fase 2
  (cifrado AES-GCM de extremo a extremo antes de guardar y sincronizar).
- Al cambiar el modelo de datos habrá que subir la versión de la base en `db.ts` con su migración.
