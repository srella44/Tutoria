// GET  /api/sync?desde=N  → filas cambiadas después de la versión N (máx. 500 por llamada).
// POST /api/sync          → { filas: [...] } sube cambios; gana el cambio más reciente de cada fila (t).
interface Env {
  DB: D1Database
}
interface Fila {
  tabla: string
  id: string
  iv: string
  c: string
  t: number
  borrado: 0 | 1
}

const TABLAS = new Set(['cursos', 'alumnos', 'contactos', 'profesionales', 'registros', 'acuerdos', 'ahers', 'frases'])
const LIMITE = 500

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const desde = Number(new URL(request.url).searchParams.get('desde') ?? 0) || 0
  const { results } = await env.DB
    .prepare('SELECT tabla, id, iv, c, t, borrado, version FROM filas WHERE version > ? ORDER BY version LIMIT ?')
    .bind(desde, LIMITE)
    .all<Fila & { version: number }>()
  return Response.json({ filas: results, mas: results.length === LIMITE })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { filas } = await request.json<{ filas: Fila[] }>()
  if (!Array.isArray(filas) || filas.length > LIMITE) return new Response('Petición no válida', { status: 400 })
  const validas = filas.filter((f) => TABLAS.has(f.tabla) && typeof f.id === 'string' && typeof f.iv === 'string'
    && typeof f.c === 'string' && Number.isFinite(f.t) && f.id.length < 200 && f.c.length < 2_000_000)
  if (!validas.length) return Response.json({ version: 0 })

  const actual = await env.DB.prepare("SELECT valor FROM meta WHERE clave = 'version'").first<{ valor: string }>()
  let version = Number(actual?.valor ?? 0)
  const sentencias = validas.map((f) => env.DB.prepare(
    `INSERT INTO filas (tabla, id, iv, c, t, borrado, version) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (tabla, id) DO UPDATE SET iv = excluded.iv, c = excluded.c, t = excluded.t,
       borrado = excluded.borrado, version = excluded.version
     WHERE excluded.t >= filas.t`,
  ).bind(f.tabla, f.id, f.iv, f.c, f.t, f.borrado ? 1 : 0, ++version))
  sentencias.push(env.DB.prepare("INSERT INTO meta (clave, valor) VALUES ('version', ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor").bind(String(version)))
  await env.DB.batch(sentencias)
  return Response.json({ version })
}
