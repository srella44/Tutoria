# 0020 · Agenda: Aué y Seguiment en una sola sección

- **Decisión:** Aué (calendario) y Seguiment (pendientes) se unen en **Agenda** (`/agenda`). Arriba, semana o mes; debajo, lo del día; al pie, los Pendents. Las rutas `/uei` y `/seguimiento` redirigen a `/agenda`. En la barra inferior, Agenda ocupa el sitio de Seguiment.
- **Anotar en un día:** botón «Anotar» con tres clases: Nòta, Ahèr y Data deth cors, con hora opcional.
- **Modelo:** las notas y fechas del curso son `Aher` con `clase: 'nota' | 'data'` (sin valor = tarea). Así se cifran y sincronizan igual que los Ahèrs, sin tablas nuevas. `esTarea()` las excluye de las listas de tareas, de los vencidos y de las actas.
- **Horario:** no aparece en la Agenda; ya está en Orari y en el «Ara / Dempús» de Inici.
- **Te escoti e incidencias:** en Pendents solo como recuento y enlace, con la misma protección de siempre.
