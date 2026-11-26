import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const vista = new URL('../dist-preview/index.html', import.meta.url)
const icono = await readFile(new URL('../public/favicon.svg', import.meta.url))
const html = await readFile(vista, 'utf8')
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
if (!scripts.length || scripts.some(([, atributos]) => /\bsrc\s*=/i.test(atributos))) {
  throw new Error('La edición local debe tener el código incrustado')
}

const hashes = scripts.map(([, , codigo]) => `'sha256-${createHash('sha256').update(codigo).digest('base64')}'`)
const politica = [
  "default-src 'none'",
  `script-src ${hashes.join(' ')}`,
  "style-src 'unsafe-inline'",
  'img-src data: blob:',
  'frame-src blob:',
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join('; ')

await writeFile(vista, html
  .replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${politica}">`)
  .replace('href="/favicon.svg"', `href="data:image/svg+xml;base64,${icono.toString('base64')}"`))
