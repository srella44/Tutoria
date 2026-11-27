// PDF del acta propia («popurrí»): Claustre, Cicle, Mentoria y amassades sin hoja oficial.
// Libreta pautada con margen rojo, título de etiquetadora, puntos en post-its, notas escritas sobre la pauta en cursiva azul,
// Ahèrs en post-its a dos columnas, logo de la escuela y sello «OK!». Se generan páginas nuevas si hace falta.
import type { PDFFont, PDFImage, PDFPage, RGB } from 'pdf-lib'

export interface DatosActaPropia {
  titulo: string
  /** Tiras de colores bajo el título: fecha y hora, tipo, mèstre/a. */
  etiquetas: string[]
  lineas: string[]
  puntos: { titulo: string; notas: string }[]
  notasGenerales?: { titulo: string; texto: string }
  ahers?: { titulo: string; items: { texto: string; detalle: string; hecho: boolean }[] }
  logo?: string
  sello: boolean
  pie: string
}

const ANCHO = 595.28
const ALTO = 841.89
const IZQ = 56
const DER = 40
const ARRIBA = 50
const ABAJO = 56
const PAUTA = 18

export async function generarActaPropia(datos: DatosActaPropia) {
  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255)
  const c = {
    papel: hex('#fffdf7'), pauta: hex('#b5d4f4'), margen: hex('#f09595'), cinta: hex('#fac775'),
    tinta: hex('#2c2c2a'), gris: hex('#5f5e5a'), suave: hex('#888780'), titulo: hex('#993c1d'),
    seccion: hex('#854f0b'), boli: hex('#185fa5'), borde: hex('#444441'), blanco: rgb(1, 1, 1), sello: hex('#ed93b1'), selloTexto: hex('#4b1528'),
  }
  const postits = ['#fac775', '#9fe1cb', '#cecbf6', '#f4c0d1', '#f5c4b3'].map(hex)
  const coloresEtiqueta = ['#d85a30', '#185fa5', '#3b6d11'].map(hex)

  const doc = await PDFDocument.create()
  doc.setTitle(datos.titulo)
  doc.setProducer('Tutoria')
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold)
  const cursiva = await doc.embedFont(StandardFonts.HelveticaOblique)
  const permitidos = new Set(normal.getCharacterSet())
  // Helvetica estándar solo admite WinAnsi: lo demás (emojis…) se sustituye.
  const limpio = (texto: string) => [...texto.normalize('NFC')].map((ch) => ch === '\n' || permitidos.has(ch.codePointAt(0) ?? 0) ? ch : '?').join('')

  const partir = (texto: string, fuente: PDFFont, tamano: number, ancho: number) => {
    const resultado: string[] = []
    for (const parrafo of limpio(texto).split(/\r?\n/)) {
      let linea = ''
      for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
        const candidata = linea ? `${linea} ${palabra}` : palabra
        if (linea && fuente.widthOfTextAtSize(candidata, tamano) > ancho) {
          resultado.push(linea)
          linea = palabra
        } else linea = candidata
      }
      resultado.push(linea)
    }
    return resultado
  }

  const paginas: PDFPage[] = []
  let pagina!: PDFPage
  let y = 0
  const nuevaPagina = () => {
    pagina = doc.addPage([ANCHO, ALTO])
    paginas.push(pagina)
    pagina.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: c.papel })
    for (let linea = ALTO - 72; linea > 30; linea -= PAUTA) {
      pagina.drawLine({ start: { x: 0, y: linea }, end: { x: ANCHO, y: linea }, thickness: 0.6, color: c.pauta })
    }
    pagina.drawLine({ start: { x: 38, y: 0 }, end: { x: 38, y: ALTO }, thickness: 2, color: c.margen })
    y = ALTO - ARRIBA
  }
  const cabe = (alto: number) => {
    if (y - alto < ABAJO) nuevaPagina()
  }
  const anchoUtil = ANCHO - IZQ - DER

  nuevaPagina()
  // Sello.
  if (datos.sello) {
    const cx = ANCHO - DER - 26
    const cy = ALTO - ARRIBA - 22
    pagina.drawEllipse({ x: cx, y: cy, xScale: 27, yScale: 27, color: c.sello, borderColor: c.blanco, borderWidth: 2 })
    const ancho = negrita.widthOfTextAtSize('OK!', 13)
    pagina.drawText('OK!', { x: cx - ancho / 2 + 2, y: cy - 6, size: 13, font: negrita, color: c.selloTexto, rotate: degrees(12) })
  }

  // Cabecera: logo, título y datos.
  let xTitulo = IZQ
  if (datos.logo) {
    try {
      const imagen: PDFImage = datos.logo.startsWith('data:image/png') ? await doc.embedPng(datos.logo) : await doc.embedJpg(datos.logo)
      const medida = imagen.scaleToFit(110, 58)
      pagina.drawImage(imagen, { x: IZQ, y: y - medida.height, ...medida })
      xTitulo = IZQ + medida.width + 14
    } catch {
      // Un logo que no se puede leer no impide generar el acta.
    }
  }
  const anchoTitulo = ANCHO - DER - 70 - xTitulo
  const inicioCabecera = y
  // Título de etiquetadora: tira negra con letras blancas espaciadas (Courier); datos en tiras de colores.
  const dymo = await doc.embedFont(StandardFonts.CourierBold)
  const espaciado = (texto: string, tam: number, extra: number) => dymo.widthOfTextAtSize(texto, tam) + extra * Math.max(0, texto.length - 1)
  const tira = (texto: string, x: number, yArriba: number, tam: number, extra: number, fondo: RGB, alto: number) => {
    const ancho = espaciado(texto, tam, extra) + 2 * (tam * 0.7)
    pagina.drawRectangle({ x, y: yArriba - alto, width: ancho, height: alto, color: fondo })
    let cx = x + tam * 0.7
    for (const ch of texto) {
      pagina.drawText(ch, { x: cx, y: yArriba - alto / 2 - tam * 0.33, size: tam, font: dymo, color: c.blanco })
      cx += dymo.widthOfTextAtSize(ch, tam) + extra
    }
    return ancho
  }
  const palabrasEnTiras = (texto: string, tam: number, extra: number, ancho: number) => {
    const resultado: string[] = []
    let linea = ''
    for (const palabra of limpio(texto).split(/\s+/).filter(Boolean)) {
      const candidata = linea ? `${linea} ${palabra}` : palabra
      if (linea && espaciado(candidata, tam, extra) + 2 * tam * 0.7 > ancho) {
        resultado.push(linea)
        linea = palabra
      } else linea = candidata
    }
    if (linea) resultado.push(linea)
    return resultado
  }
  let yt = y
  for (const linea of palabrasEnTiras(`${datos.titulo.toLocaleUpperCase()}!`, 18, 2.2, anchoTitulo)) {
    tira(linea, xTitulo, yt, 18, 2.2, c.tinta, 28)
    yt -= 32
  }
  yt -= 2
  let xe = xTitulo
  for (const [i, etiqueta] of datos.etiquetas.filter(Boolean).entries()) {
    const texto = limpio(etiqueta.toLocaleUpperCase())
    const ancho = espaciado(texto, 9, 0.9) + 2 * 9 * 0.7
    if (xe > xTitulo && xe + ancho > xTitulo + anchoTitulo) {
      xe = xTitulo
      yt -= 19
    }
    tira(texto, xe, yt, 9, 0.9, coloresEtiqueta[i % coloresEtiqueta.length], 15)
    xe += ancho + 6
  }
  yt -= 19
  for (const linea of datos.lineas.filter(Boolean).flatMap((l) => partir(l, normal, 10, anchoTitulo))) {
    pagina.drawText(linea, { x: xTitulo, y: yt - 10, size: 10, font: normal, color: c.gris })
    yt -= 13
  }
  y = Math.min(yt, inicioCabecera - 62) - 12

  // Post-it con título en negrita y notas en bocadillo; se parte entre páginas si es muy largo.
  const tamTitulo = 11
  const tamNota = 10.5
  const interTitulo = 14
  // Post-it como etiqueta del punto; lo redactado se escribe debajo, sobre la pauta, en cursiva azul («boli»).
  const PRIMERA_PAUTA = ALTO - 72
  const siguientePauta = (desde: number) => PRIMERA_PAUTA - Math.ceil((PRIMERA_PAUTA - desde) / PAUTA) * PAUTA
  const postit = (titulo: string, notas: string, color: RGB, giro: number) => {
    const lineasTitulo = partir(titulo, negrita, tamTitulo, anchoUtil - 20)
    const altoTitulo = lineasTitulo.length * interTitulo
    const anchoEtiqueta = Math.min(anchoUtil, Math.max(...lineasTitulo.map((l) => negrita.widthOfTextAtSize(l, tamTitulo))) + 20)
    const alto = 9 + altoTitulo + 5
    cabe(alto + PAUTA + 4)
    pagina.drawRectangle({ x: IZQ, y: y - alto, width: anchoEtiqueta, height: alto, color, rotate: degrees(giro) })
    let cursor = y - 9 - tamTitulo + 1
    for (const linea of lineasTitulo) {
      pagina.drawText(linea, { x: IZQ + 10, y: cursor, size: tamTitulo, font: negrita, color: c.tinta })
      cursor -= interTitulo
    }
    y -= alto + 2
    const lineasNota = notas.trim() ? partir(notas.trim(), cursiva, tamNota, anchoUtil - 12) : []
    for (const linea of lineasNota) {
      let base = siguientePauta(y - tamNota) + 3
      if (base < ABAJO) {
        nuevaPagina()
        base = siguientePauta(y - tamNota) + 3
      }
      if (linea) pagina.drawText(linea, { x: IZQ + 12, y: base, size: tamNota, font: cursiva, color: c.boli })
      y = base - 3 - 2
    }
    y -= 12
  }

  datos.puntos.forEach((p, i) => postit(`${i + 1}. ${p.titulo}`, p.notas, postits[i % postits.length], [-0.8, 0.6, -0.4, 0.5, -0.7][i % 5]))
  if (datos.notasGenerales?.texto.trim()) postit(datos.notasGenerales.titulo, datos.notasGenerales.texto, postits[0], 0.4)

  // Ahèrs: post-its a dos columnas con casilla dibujada.
  if (datos.ahers?.items.length) {
    cabe(40)
    y -= 6
    pagina.drawText(limpio(datos.ahers.titulo), { x: IZQ, y: y - 13, size: 13, font: negrita, color: c.seccion })
    y -= 26
    const hueco = 12
    const anchoCol = (anchoUtil - hueco) / 2
    for (let i = 0; i < datos.ahers.items.length; i += 2) {
      const fila = datos.ahers.items.slice(i, i + 2).map((a) => ({
        ...a,
        lineas: partir(a.texto, negrita, 10.5, anchoCol - 34),
        detalles: a.detalle ? partir(a.detalle, normal, 9.5, anchoCol - 34) : [],
      }))
      const alto = Math.max(...fila.map((a) => 10 + a.lineas.length * 13 + a.detalles.length * 12 + 10))
      cabe(alto)
      fila.forEach((a, j) => {
        const x = IZQ + j * (anchoCol + hueco)
        pagina.drawRectangle({ x, y: y - alto, width: anchoCol, height: alto, color: postits[(i + j + 3) % postits.length], rotate: degrees(j ? 0.6 : -0.6) })
        pagina.drawRectangle({ x: x + 10, y: y - 21, width: 10, height: 10, borderColor: c.tinta, borderWidth: 1 })
        if (a.hecho) {
          pagina.drawLine({ start: { x: x + 11.5, y: y - 16 }, end: { x: x + 14.5, y: y - 19.5 }, thickness: 1.4, color: c.tinta })
          pagina.drawLine({ start: { x: x + 14.5, y: y - 19.5 }, end: { x: x + 19, y: y - 12 }, thickness: 1.4, color: c.tinta })
        }
        let cursor = y - 10 - 9.5
        for (const linea of a.lineas) {
          pagina.drawText(linea, { x: x + 26, y: cursor, size: 10.5, font: negrita, color: c.tinta })
          cursor -= 13
        }
        for (const linea of a.detalles) {
          pagina.drawText(linea, { x: x + 26, y: cursor, size: 9.5, font: normal, color: c.gris })
          cursor -= 12
        }
      })
      y -= alto + 10
    }
  }

  paginas.forEach((p, i) => {
    const texto = limpio(`${datos.pie} · ${i + 1}/${paginas.length}`)
    p.drawText(texto, { x: ANCHO - DER - normal.widthOfTextAtSize(texto, 8), y: 24, size: 8, font: normal, color: c.suave })
  })
  return doc.save()
}
