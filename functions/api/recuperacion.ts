// La copia de la llave de datos protegida con la clave de recuperación (cifrada: el servidor no la puede abrir).
// Un dispositivo nuevo la descarga y la abre con la clave que el tutor tiene en papel.
interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const fila = await env.DB.prepare("SELECT valor FROM meta WHERE clave = 'recuperacion'").first<{ valor: string }>()
  return fila ? new Response(fila.valor, { headers: { 'content-type': 'application/json' } }) : new Response(null, { status: 404 })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const cuerpo = await request.text()
  const datos = JSON.parse(cuerpo) as Record<string, unknown>
  if (typeof datos.salt !== 'string' || typeof datos.iv !== 'string' || typeof datos.dek !== 'string' || cuerpo.length > 4096) {
    return new Response('Petición no válida', { status: 400 })
  }
  await env.DB.prepare("INSERT INTO meta (clave, valor) VALUES ('recuperacion', ?) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor")
    .bind(cuerpo).run()
  return new Response(null, { status: 204 })
}
