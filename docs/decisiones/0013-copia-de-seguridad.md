# 0013 · Copia de seguridad cifrada

- **Estado:** aceptada
- **Fecha:** 2026-11-27

## Decisión

- Ajustes › Donades › **Descargar còpia de seguretat** baja `tutoria-copia-AAAA-MM-DD.json` con las filas tal como
  están guardadas (cifradas con la llave de datos) y la copia de la llave envuelta con la clave de recuperación.
  No contiene nada legible.
- **Restaurar ua còpia:** antes de tocar nada se descifra la copia entera (prueba de restauración) y se muestra
  cuántos alumnos, registros y contactos tiene. En el mismo aparato (o uno de la misma cuenta) abre con la llave
  actual; si es de otra cuenta, pide la clave de recuperación. Restaurar sustituye todo, vuelve a cifrar con la
  llave actual y se sincroniza (también los borrados).
- Se recuerda la fecha de la última copia. Recomendado: una copia al mes, guardada fuera del ordenador.
