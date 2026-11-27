# 0016 · Actas firmadas: plantilla guardada, modo firma y acta definitiva

**Estado:** aceptada · 2026-11-27

## Contexto
Las hojas oficiales (familia y T’escoti) ya se rellenaban sobre el PDF original, pero la plantilla había que elegirla
cada vez, los borradores vivían en un almacén aparte sin sincronizar y el PDF firmado solo se descargaba.

## Decisión
- Tres colecciones nuevas, cifradas y sincronizadas como el resto: `plantillas` (PDF original, comprobado por huella),
  `borradores` (campos, motivos y firmas de cada cita) y `actas` (PDF firmado, versión, fecha, huella SHA-256 y firmantes).
- Modo firma: superposición a pantalla completa con la vista previa y las casillas; sale solo con el PIN (`verificarPin`).
- Acta definitiva: se genera el PDF con un sello de versión y fecha al pie, se calcula su huella y se guarda; la cita pasa a
  `firmado` y sus campos quedan de solo lectura. «Version naua» la reabre; las versiones firmadas no se borran.
- «Bloqueada» significa bloqueada en la app (no se puede editar sin crear una versión). El PDF no se cifra: es el documento
  que se entrega o se archiva. Firma electrónica simple; para casos excepcionales, certificado sobre el PDF exportado.

## Consecuencias
Un PDF de más de ~1 MB no cabe en una fila de D1: se guarda en el aparato y se avisa.
