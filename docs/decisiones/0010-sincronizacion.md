# 0010 · Sincronización cifrada con Cloudflare Pages + D1

- **Estado:** aceptada
- **Fecha:** 2026-11-26

## Decisión

- **Servidor:** la app se publica en Cloudflare Pages y la API vive en `functions/api/` (Pages Functions) con una
  base D1 (`migrations/0001_sync.sql`). Cloudflare Access va delante de todo el dominio; la API además
  comprueba la firma del token de Access (`functions/api/_middleware.ts`, variables `ACCESS_TEAM_DOMAIN` y
  `ACCESS_AUD`).
- **Qué se guarda:** solo filas cifradas `{ tabla, id, iv, c, t, borrado, version }`. El servidor no tiene la
  llave de datos y no puede leer nada. Tampoco la clave de recuperación: guarda la copia de la llave envuelta
  con ella (`/api/recuperacion`), que solo se abre con la clave que el tutor tiene en papel.
- **Protocolo:** cada cambio local va a una cola (`cola` en IndexedDB) y se sube a los 3 s, al abrir la app,
  cada minuto y al volver a ella (`POST /api/sync`). Se baja lo posterior a la última versión vista
  (`GET /api/sync?desde=N`). Con un solo usuario, gana el cambio más reciente de cada fila (`t`); un cambio
  local sin subir no se pisa. Los borrados viajan como marcas (`borrado = 1`).
- **Dispositivo nuevo:** en la pantalla de crear PIN aparece «Ja utilizi TUTOR-ia en un aute dispositiu».
  Con la clave de recuperación se abre la llave descargada del servidor, se crea un PIN para ese dispositivo y
  se descargan los datos. (El QR puede venir después: llevaría la misma clave.)
- Cuando llegan cambios de otro dispositivo, el store se vuelve a cargar.
- **Una sola cuenta por servidor.** Activar la sincronización solo es posible si el servidor aún no tiene
  copia de recuperación. Si ya la tiene, el dispositivo debe borrar sus datos (Ajustes › Donades) y unirse con
  la clave: así nunca se mezclan filas cifradas con llaves distintas. Si aun así llega una fila que no se
  puede descifrar, se salta y la app sigue funcionando.
- **Reiniciar el servidor** (solo con datos de prueba): en la consola de D1, `DELETE FROM filas; DELETE FROM meta;`.

## Probado

En local con `wrangler pages dev` y dos navegadores: unir un dispositivo con la clave, recibir alumnado y
observaciones, crear un Ahèr en uno y verlo en el otro, y propagar un borrado. En el servidor solo hay
contenido cifrado.
