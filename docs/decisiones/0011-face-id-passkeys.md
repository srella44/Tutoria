# 0011 · Desbloqueo con Face ID / Windows Hello (passkeys con PRF)

- **Estado:** aceptada
- **Fecha:** 2026-11-27

## Decisión

- Desde Ajustes se activa en cada dispositivo una **passkey** de TUTOR-ia (WebAuthn, `rpId` = dominio de la app,
  verificación de usuario obligatoria). Con la extensión **PRF**, la passkey devuelve tras Face ID / Touch ID /
  Windows Hello un secreto de 32 bytes que solo el autenticador puede calcular (sal fija `tutoria-prf-v1`).
- De ese secreto se deriva con HKDF una llave AES-GCM que envuelve la llave de datos (DEK):
  - en el dispositivo (`candado.passkey`): botón **«Desblocar damb Face ID»** en la pantalla de PIN;
  - en el servidor (`/api/passkey`, ilegible para él): un dispositivo nuevo con la misma passkey sincronizada
    (llavero de iCloud) se une con **«Utilizar Face ID en lòc dera clau»**, sin la clave de recuperación.
- El PIN sigue existiendo en cada dispositivo como alternativa; la clave de recuperación, para emergencias.
- Si el aparato o navegador no admite PRF, Ajustes lo dice y todo sigue con PIN.

## Limitaciones

- En Windows, la passkey de Windows Hello queda en ese ordenador: sirve para desbloquear, no para recuperar
  tras borrar el navegador.
- Las passkeys van ligadas al dominio: al pasar a `tutoria.pretzhet.app` habrá que activarlas de nuevo.
- Probado con el autenticador virtual de Chrome (activar, bloquear, desbloquear). Unir un dispositivo con una
  passkey sincronizada no se puede simular (el autenticador virtual no copia el secreto PRF): probar en
  iPhone + iPad/Mac reales.
