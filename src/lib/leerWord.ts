// Lee las tablas de un documento Word (.docx) como filas de celdas de texto, para los importadores.
// Las celdas combinadas en horizontal dejan el texto en la primera columna y las demás vacías;
// las combinadas en vertical, el texto en la primera fila. Todo se lee en el dispositivo.
import type { Celda } from './importar'

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

const hijos = (el: Element, nombre: string) => [...el.children].filter((c) => c.namespaceURI === W && c.localName === nombre)

function textoCelda(tc: Element) {
  return [...tc.getElementsByTagNameNS(W, 'p')]
    .map((p) => [...p.getElementsByTagNameNS(W, '*')]
      .map((x) => (x.localName === 't' ? x.textContent ?? '' : x.localName === 'br' || x.localName === 'cr' ? '\n' : x.localName === 'tab' ? ' ' : ''))
      .join(''))
    .filter((x) => x.trim())
    .join('\n')
}

/** Cada tabla del documento (también las anidadas en otras celdas no: solo las de primer nivel). */
export async function leerTablasWord(archivo: File): Promise<{ hoja: string; filas: Celda[][] }[]> {
  const { unzipSync, strFromU8 } = await import('fflate')
  const zip = unzipSync(new Uint8Array(await archivo.arrayBuffer()), { filter: (f) => f.name === 'word/document.xml' })
  const xml = zip['word/document.xml']
  if (!xml) throw new Error('no-docx')
  const doc = new DOMParser().parseFromString(strFromU8(xml), 'application/xml')
  const body = doc.getElementsByTagNameNS(W, 'body')[0]
  const tablas = [...doc.getElementsByTagNameNS(W, 'tbl')].filter((t) => t.parentElement === body || t.parentElement?.localName !== 'tc')
  return tablas.map((tbl, i) => ({
    hoja: `${archivo.name} · ${i + 1}`,
    filas: hijos(tbl, 'tr').map((tr) => {
      const fila: Celda[] = []
      for (const tc of hijos(tr, 'tc')) {
        const pr = hijos(tc, 'tcPr')[0]
        const span = Number(pr && hijos(pr, 'gridSpan')[0]?.getAttributeNS(W, 'val')) || 1
        const vMerge = pr && hijos(pr, 'vMerge')[0]
        const continua = vMerge && (vMerge.getAttributeNS(W, 'val') ?? 'continue') !== 'restart'
        fila.push(continua ? '' : textoCelda(tc))
        for (let k = 1; k < span; k++) fila.push('')
      }
      return fila
    }),
  }))
}
