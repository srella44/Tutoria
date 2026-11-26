// Solo entra quien haya pasado por Cloudflare Access: se comprueba la firma del token que Access añade.
// En local (wrangler pages dev) se puede saltar con MODO_DESARROLLO=1.
interface Env {
  ACCESS_TEAM_DOMAIN?: string // p. ej. «pretzhet.cloudflareaccess.com»
  ACCESS_AUD?: string // «Application Audience (AUD) Tag» de la aplicación de Access
  MODO_DESARROLLO?: string
}

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0))
const json = (s: string) => JSON.parse(new TextDecoder().decode(b64url(s)))

async function tokenValido(token: string, equipo: string, aud: string) {
  const [h, p, firma] = token.split('.')
  if (!h || !p || !firma) return false
  const cabecera = json(h)
  const datos = json(p)
  const ahora = Date.now() / 1000
  const audiencias = Array.isArray(datos.aud) ? datos.aud : [datos.aud]
  if (!audiencias.includes(aud) || datos.exp < ahora || datos.iss !== `https://${equipo}`) return false
  const { keys } = await (await fetch(`https://${equipo}/cdn-cgi/access/certs`)).json<{ keys: (JsonWebKey & { kid: string })[] }>()
  const jwk = keys.find((k) => k.kid === cabecera.kid)
  if (!jwk) return false
  const llave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', llave, b64url(firma), new TextEncoder().encode(`${h}.${p}`))
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  if (env.MODO_DESARROLLO === '1') return next()
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !token || !(await tokenValido(token, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD))) {
    return new Response('No autorizado', { status: 401 })
  }
  return next()
}
