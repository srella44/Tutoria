// Copias de la llave de datos envueltas con passkeys (cifradas: el servidor no las puede abrir).
// GET /api/passkey?id=<credencial>  ·  PUT /api/passkey { id, iv, dek }  ·  DELETE /api/passkey?id=<credencial>
interface Env {
  DB: D1Database
}

const clave = (id: string) => `passkey:${id}`
const idValido = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{8,512}$/.test(id)

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!idValido(id)) return new Response('Petición no válida', { status: 400 })
  const fila = await env.DB.prepare('SELECT valor FROM meta WHERE clave = ?').bind(clave(id)).first<{ valor: string }>()
  return fila ? new Response(fila.valor, { headers: { 'content-type': 'application/json' } }) : new Response(null, { status: 404 })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const cuerpo = await request.text()
  const d = JSON.parse(cuerpo) as Record<string, unknown>
  if (!idValido(d.id) || typeof d.iv !== 'string' || typeof d.dek !== 'string' || cuerpo.length > 4096) {
    return new Response('Petición no válida', { status: 400 })
  }
  await env.DB.prepare('INSERT INTO meta (clave, valor) VALUES (?, ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor')
    .bind(clave(d.id), cuerpo).run()
  return new Response(null, { status: 204 })
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!idValido(id)) return new Response('Petición no válida', { status: 400 })
  await env.DB.prepare('DELETE FROM meta WHERE clave = ?').bind(clave(id)).run()
  return new Response(null, { status: 204 })
}
