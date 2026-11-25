# AGENTS.md · Tutoria

Instrucciones para cualquier agente de código (Claude Code, Codex) que trabaje en este repositorio.
La fuente de verdad del producto es el documento «Tutoria · Proyecto definitivo»; aquí se resume lo necesario para programar.

## Qué es

Tutoria es el cuaderno digital de tutoría personal de un maestro tutor de Primaria en la Val d'Aran:
alumnado, familias, reuniones, observaciones, evaluación e informes en un único lugar.
PWA para un solo usuario, en `tutoria.pretzhet.app`, sin cuotas.

## Principios (deciden cualquier duda)

1. **Funciona sin IA.** Todo flujo esencial (acta, observación, informe) se completa sin IA.
2. **La IA no inventa ni evalúa.** Solo ordena y redacta lo registrado. Nunca diagnostica, interpreta ni propone notas.
3. **Capturar en 5 segundos.** La captura rápida es la función más importante.
4. **Privacidad por diseño.** Cifrado en el dispositivo, datos mínimos, plazos de conservación. Nada personal sale sin anonimizar.
5. **Una sola entidad.** Observaciones, incidencias, comunicaciones, reuniones, evaluaciones… son `Registro` con `tipo`.
6. **Aranés primero.** Interfaz y documentos en aranés (normativa del Institut d'Estudis Aranesi); castellano como segundo idioma.
7. **Hecho para muchos años.** Cursos, promoción y archivo desde el principio.
8. **Sin cuotas.** Solo planes gratuitos.

## Reglas para agentes

- **Nunca datos reales.** Solo alumnado ficticio (`src/data/demo.ts`). No añadas nombres, fotos ni textos reales al repo.
- **Textos de interfaz** solo en `src/lib/i18n.tsx`, con su versión `oc` (aranés) y `es`. No inventes aranés nuevo sin marcarlo en `docs/pendientes.md` para validación.
- **Registros protegidos** (Te escoti, temas delicados) nunca muestran su texto sin desbloqueo.
- **Nada sale del dispositivo** sin pasar por la capa de anonimización (Fase 5). A servicios lingüísticos solo palabras sueltas.
- Cada decisión de arquitectura relevante → un fichero nuevo en `docs/decisiones/` (formato ADR corto).
- Al terminar una tarea: actualiza `docs/funcionalidades.md` (qué existe) y `docs/pendientes.md` (qué falta).
- Antes de hacer commit: `npm run build` y `npm run lint` sin errores.

## Stack

| Pieza | Elección |
| --- | --- |
| Interfaz | React 19 + TypeScript + Vite, Tailwind CSS 4; PWA (`vite-plugin-pwa`) |
| Rutas | `react-router-dom` |
| Iconos | `lucide-react` |
| Datos locales | IndexedDB con Dexie, cifrado con WebCrypto (Fase 1–2) |
| Sincronización | Cloudflare Worker + D1 (Fase 2) |
| Acceso | Cloudflare Access + passkey (Fase 2) |
| Firma / PDF | `signature_pad`, `pdf-lib` o `pdfmake` (Fase 3) |

## Estructura

```
src/
  App.tsx              rutas
  components/          Layout (barra inferior / lateral), QuickCapture, RegistroItem, ui
  pages/               Hoy, Alumnado, AlumnoFicha, Agenda, Seguimiento, Reunion
  data/types.ts        modelo de datos
  data/demo.ts         alumnado ficticio (fechas relativas a hoy)
  data/store.tsx       estado (Fase 0: en memoria)
  lib/i18n.tsx         textos oc / es
  lib/fechas.ts        utilidades de fecha
docs/
  decisiones/          ADR
  funcionalidades.md   qué hace la app hoy
  pendientes.md        qué falta, material y validaciones pendientes
```

## Comandos

```
npm install
npm run dev       # desarrollo
npm run build     # comprobación de tipos + build
npm run lint      # oxlint
npm run preview   # sirve dist/
```

## Diseño

iPhone 17 como referencia táctil. Sobrio, un color de acento (`--color-accent`), zonas táctiles ≥ 44 px,
modo oscuro automático. iPhone: barra inferior con cuatro secciones y `+` central. iPad/ordenador: barra lateral.
