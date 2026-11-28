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
- **Cifrado:** todo lo que se guarde en IndexedDB pasa por `src/data/db.ts` (`preparar`/`leer`), que cifra con la llave de datos. No escribas en IndexedDB por otra vía ni guardes datos personales en `localStorage`.
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
| Datos locales | IndexedDB con Dexie; cada fila cifrada con AES-GCM (`src/lib/cripto.ts`, PIN y clave de recuperación, decisión 0009) |
| Sincronización | Pages Functions (`functions/api/`) + D1 (`migrations/`), solo filas cifradas (decisión 0010) |
| Acceso | Cloudflare Access; un único PIN para todos los dispositivos (decisión 0012) |
| Firma / PDF | `signature_pad`, `pdf-lib` o `pdfmake` (Fase 3) |

## Estructura

```
src/
  App.tsx              rutas
  components/          Layout (barra inferior / lateral), Ajustes, QuickCapture, RegistroItem, ui
  pages/               Inicio (botones), Agenda (calendario + Pendents), Alumnado, AlumnoFicha, Reuniones, Reunion (modo reunión)
  data/types.ts        modelo de datos
  data/demo.ts         alumnado ficticio (fechas relativas a hoy)
  data/store.tsx       estado y ciclo de sincronización
  data/db.ts           IndexedDB (Dexie), cifrado por fila, cola y sincronización
  lib/cripto.ts        llave de datos, PIN, clave de recuperación (AES-GCM, PBKDF2)
  components/Cerradura.tsx  crear PIN, desbloquear, recuperar, unir dispositivo, bloqueo automático
functions/api/         API de sincronización (Cloudflare Pages Functions + D1)
migrations/            esquema de D1
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
npx wrangler pages dev dist --binding MODO_DESARROLLO=1   # app + API con D1 local (ver docs/despliegue.md)
```

## Diseño

iPhone 17 como referencia táctil. Sobrio, un color de acento (`--color-accent`), zonas táctiles ≥ 44 px,
siempre tema claro, sin modo oscuro (decisión 0007). Menú: Inici · Alumnat · + · Amassades · Agenda; Claustre desde Inici y la barra lateral (decisiones 0003, 0006 y 0020).
Inici es una pantalla de botones grandes sin barra; dentro de las secciones, barra inferior con `+` central. iPad/ordenador: barra lateral. Ajustes siempre en el engranaje arriba a la derecha.
