# 0001 · Stack y backend

- **Estado:** aceptada
- **Fecha:** 2026-11-25

## Decisión

PWA con React + TypeScript + Vite y Tailwind, local-first. Cloudflare (Pages, Workers, D1, Access) como único proveedor:
solo sincroniza datos cifrados, sirve la IA (Workers AI) y la API lingüística. Código en GitHub privado;
desarrollo con Claude Code, Codex como alternativa.

## Motivo

- Sin pausas por inactividad en verano y todo cabe en planes gratuitos.
- Un solo proveedor, ya en uso para el servidor MCP de recursos aranesos.

## Descartado

| Opción | Motivo |
| --- | --- |
| Zite | Límite de 5.000 registros, dominio de pago, sin firma, PDF ni cifrado |
| Supabase | Pausa tras 7 días de inactividad y sin copias en el plan gratuito |
| WebLLM (IA en el navegador) | Los modelos que caben escriben mal en aranés; se reevaluará |
