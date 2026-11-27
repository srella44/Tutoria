# 0009 · Cifrado en el dispositivo, PIN y clave de recuperación

- **Estado:** aceptada
- **Fecha:** 2026-11-26

## Decisión

Primer paso de la Fase 2: los datos se guardan cifrados en el dispositivo y la app se abre con un PIN.

- **Llave de datos (DEK):** AES-GCM de 256 bits, generada en el dispositivo. Cada fila de IndexedDB se guarda
  como `{ id, iv, c }`: solo el id queda a la vista. El contexto `tabla:id` va como dato adicional autenticado,
  así una fila cifrada no se puede mover a otra tabla u otro id.
- **PIN (4–8 cifras):** la DEK se guarda envuelta con una llave derivada del PIN (PBKDF2-SHA-256,
  600 000 iteraciones, sal aleatoria) y, encima, con una **llave del dispositivo no extraíble** guardada en
  IndexedDB. Copiar la base de datos no basta sin el PIN, y probar PINs fuera del navegador no es posible
  sin esa llave.
- **Intentos:** tras 5 PIN incorrectos se borra la copia de la DEK protegida por PIN. Solo se vuelve a entrar con
  la **clave de recuperación** (20 caracteres, unos 100 bits, para imprimir), que envuelve otra copia de la DEK.
  Sin PIN ni clave, los datos no se pueden recuperar (por diseño); la pantalla ofrece borrar el dispositivo.
- **Bloqueo:** automático tras el tiempo elegido sin tocar la app (también si vuelve de segundo plano) y manual desde
  Ajustes. Bloqueada, el store no está montado: los datos descifrados no están en memoria.
- **Sesión abierta (revisión):** para no pedir el PIN en cada recarga, al desbloquear se guarda la DEK envuelta
  con una llave de sesión no extraíble (`meta.sesion`), con la hora del último uso. Al recargar, si no ha pasado el
  tiempo de bloqueo, la app se abre sin PIN; si ha pasado, o tras «Blocar ara», la sesión se borra.
  El tiempo de bloqueo se elige en Ajustes (5 min, 15 min, 1 h, 8 h); por defecto 1 hora.
- **Migración:** al crear el PIN, lo que hubiera en claro se cifra en el momento.
- Implementación: `src/lib/cripto.ts`, `src/data/db.ts`, `src/components/Cerradura.tsx`.

## Pendiente en la Fase 2

- Passkey con Face ID / Touch ID (WebAuthn, extensión PRF) como alternativa al PIN.
- Sincronización con Cloudflare (Worker + D1): solo viajan filas cifradas; la DEK se pasa a otro dispositivo
  al vincularlo con un código QR.
- Copia de seguridad cifrada descargable y prueba de restauración.
- Unificar el almacén de borradores oficiales (hoy con su propia llave de dispositivo) con esta DEK.
