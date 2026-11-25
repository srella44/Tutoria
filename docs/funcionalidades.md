# Funcionalidades

Estado actual: **Fase 0 · Prototipo navegable** con alumnado ficticio. Los datos viven en memoria y se pierden al recargar.

## Secciones

| Sección | Ruta | Qué hace hoy |
| --- | --- | --- |
| Uei / Hoy | `/` | Reuniones de hoy y mañana, acuerdos que vencen (≤ 2 días o vencidos), actas sin firmar, incidencias abiertas, Te escoti en seguimiento, alumnos sin observaciones en 14 días |
| Alumnat / Alumnado | `/alumnado` | Cuadrícula o lista del grupo, búsqueda por nombre |
| Ficha | `/alumnado/:id` | Cabecera con llamar, escribir y registrar; pestañas Cronología (filtrable por tipo, con acuerdos), Datos, Contactos (lengua, preferente, restricciones), Documentos y Evaluación (marcadores) |
| Agenda | `/agenda` | Próximas reuniones y revisiones de acuerdos; botón .ics desactivado |
| Seguiment / Seguimiento | `/seguimiento` | Acuerdos filtrables por estado y alumno; incidencias y Te escoti abiertos |
| Modo reunión | `/reunion/:id` | Asistente a pantalla completa: Preparar (última reunión, acuerdos pendientes, observaciones desde entonces), Anotar, Acta (vista previa), Firmas y PDF (marcadores) |

## Captura rápida

Botón `+` (central en iPhone, lateral en iPad/ordenador, y en cada ficha con el alumno preseleccionado):
elegir uno o varios alumnos, tipo (observación, incidencia, comunicación), frases frecuentes y texto libre.
El registro aparece al instante en la cronología y, si es incidencia, en «Hoy» y «Seguimiento».

## Otros

- Cambio de idioma aranés ⇄ castellano (barra lateral; en iPhone, cabecera de «Hoy»). Se recuerda en el navegador.
- Registros protegidos: el texto se oculta (••••••) a la espera del desbloqueo extra de la Fase 2.
- PWA instalable con service worker (actualización automática).
- Modo oscuro automático según el sistema.
