# Funcionalidades

Estado actual: **Fase 0 · Prototipo navegable** con alumnado ficticio. Los datos viven en memoria y se pierden al recargar.

## Secciones

Menú: **Inici · Alumnat · + · Reunions · Seguiment** (barra inferior en iPhone, lateral en iPad/ordenador).
Ajustes (idioma) en el engranaje de arriba a la derecha, en todas las secciones.

| Sección | Ruta | Qué hace hoy |
| --- | --- | --- |
| Inici / Inicio | `/` | Página principal con tres bloques: hoy y mañana (reuniones y acuerdos que vencen o han vencido), pendientes (actas sin firmar, incidencias y Te escoti abiertos), alumnos sin observaciones en 14 días |
| Alumnat / Alumnado | `/alumnado` | Cuadrícula o lista del grupo, búsqueda por nombre |
| Ficha | `/alumnado/:id` | Cabecera con grupo, nacimiento e información relevante; botones llamar, escribir y registrar; pestañas Cronología (filtrable, con acuerdos), Contactos y Evaluación |
| Reunions / Reuniones | `/reuniones` | Próximas y pasadas; «Reunion naua» crea una reunión (tipo, fecha, hora, alumnos); botón .ics desactivado |
| Seguiment / Seguimiento | `/seguimiento` | Acuerdos filtrables por estado y alumno; incidencias y Te escoti abiertos |
| Modo reunión | `/reunion/:id` | Asistente a pantalla completa: Preparar, Anotar, Acta (vista previa), Firmas y PDF (marcadores) |

## Captura rápida

Botón `+` (central en iPhone, lateral en iPad/ordenador, y en cada ficha con el alumno preseleccionado):
elegir uno o varios alumnos, tipo (observación, incidencia, comunicación), frases frecuentes y texto libre.
El registro aparece al instante en la cronología y, si es incidencia, en «Hoy» y «Seguimiento».

## Otros

- Cambio de idioma aranés ⇄ castellano desde Ajustes. Se recuerda en el navegador.
- Vista previa de una sola página: `npm run build:artifact` genera `dist-preview/index.html`.
- Registros protegidos: el texto se oculta (••••••) a la espera del desbloqueo extra de la Fase 2.
- PWA instalable con service worker (actualización automática).
- Modo oscuro automático según el sistema.
