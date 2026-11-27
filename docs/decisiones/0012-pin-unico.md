# 0012 · Un único PIN para todos los dispositivos

- **Estado:** aceptada
- **Fecha:** 2026-11-27
- Sustituye en parte a 0009 y 0010 (unir dispositivos) y retira 0011 (Face ID).

## Decisión

Unir un dispositivo con la clave de recuperación resultó confuso (varias claves creadas en pruebas, una sola
válida). Ahora basta el **PIN**:

- Tras escribir el PIN (crear, desbloquear, recuperar, cambiar) con la sincronización activa, se guarda en el
  servidor una copia de la llave de datos envuelta **solo con el PIN** (PBKDF2-SHA-256, 600 000 iteraciones,
  sal propia), junto a la copia de la clave de recuperación (`/api/recuperacion`: `pinSalt`, `pinIv`, `pinDek`).
- Un dispositivo nuevo: código del correo de Cloudflare Access → «Ja utilizi TUTOR-ia…» → PIN. En el dispositivo
  se crea su candado local con ese mismo PIN y su llave de dispositivo.
- La clave de recuperación queda para emergencias («He desbrembat eth PIN»).
- Face ID / Windows Hello se retira.

## Seguridad

Antes, ni con acceso a la cuenta de Cloudflare se podía abrir nada sin la clave de 100 bits. Ahora, quien
consiguiera la base D1 (entrando en la cuenta de Cloudflare) podría intentar adivinar el PIN fuera de línea;
PBKDF2 lo frena, pero un PIN corto es poco. Por eso: PIN de 6 cifras o más recomendado, y Cloudflare Access
(solo el correo del tutor) delante del servidor.
