// PDF del acta propia («popurrí»): Claustre, Cicle, Mentoria y amassades sin hoja oficial.
// Libreta pautada con margen rojo y banderines, puntos en post-its, notas en tiras de papel pegadas (cursiva),
// Ahèrs en post-its a dos columnas, logo de la escuela y sello «OK!». Se generan páginas nuevas si hace falta.
import type { PDFFont, PDFImage, PDFPage, RGB } from 'pdf-lib'

export interface DatosActaPropia {
  titulo: string
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
const ARRIBA = 78
const ABAJO = 56
const PAUTA = 18

export async function generarActaPropia(datos: DatosActaPropia) {
  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255)
  const c = {
    papel: hex('#fffdf7'), pauta: hex('#b5d4f4'), margen: hex('#f09595'), cinta: hex('#fac775'),
    tinta: hex('#2c2c2a'), gris: hex('#5f5e5a'), suave: hex('#888780'), titulo: hex('#993c1d'),
    seccion: hex('#854f0b'), borde: hex('#444441'), blanco: rgb(1, 1, 1), sello: hex('#ed93b1'), selloTexto: hex('#4b1528'),
  }
  const postits = ['#fac775', '#9fe1cb', '#cecbf6', '#f4c0d1', '#f5c4b3'].map(hex)

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
  // Banderines de los colores de los post-its y sello.
  {
    const desde = IZQ - 6
    const hasta = ANCHO - DER - (datos.sello ? 70 : 0)
    const ancho = hasta - desde
    const altura = (x: number) => 30 + 10 * (1 - ((2 * (x - desde)) / ancho - 1) ** 2)
    pagina.drawSvgPath(`M 0 30 Q ${ancho / 2} 50 ${ancho} 30`, { x: desde, y: ALTO, borderColor: c.suave, borderWidth: 0.8 })
    const n = Math.floor(ancho / 30)
    for (let i = 0; i < n; i++) {
      const x0 = desde + 6 + i * (ancho - 12) / n
      const x1 = x0 + 18
      const y0 = altura(x0)
      const y1 = altura(x1)
      pagina.drawSvgPath(`M ${x0 - desde} ${y0} L ${x1 - desde} ${y1} L ${(x0 + x1) / 2 - desde} ${(y0 + y1) / 2 + 20} Z`,
        { x: desde, y: ALTO, color: postits[i % postits.length] })
    }
  }
  if (datos.sello) {
    const cx = ANCHO - DER - 26
    const cy = ALTO - 52
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
  let yt = y - 20
  for (const linea of partir(`${datos.titulo.toLocaleUpperCase()}!`, negrita, 20, anchoTitulo)) {
    pagina.drawText(linea, { x: xTitulo, y: yt, size: 20, font: negrita, color: c.titulo })
    yt -= 23
  }
  for (const linea of datos.lineas.filter(Boolean).flatMap((l) => partir(l, normal, 10, anchoTitulo))) {
    pagina.drawText(linea, { x: xTitulo, y: yt + 6, size: 10, font: normal, color: c.gris })
    yt -= 13
  }
  y = Math.min(yt, inicioCabecera - 62) - 8

  // Post-it con título en negrita y notas en bocadillo; se parte entre páginas si es muy largo.
  const tamTitulo = 11
  const tamNota = 10.5
  const interTitulo = 14
  const interNota = 13.5
  const postit = (titulo: string, notas: string, color: RGB, giro: number, cinta: RGB) => {
    const lineasTitulo = partir(titulo, negrita, tamTitulo, anchoUtil - 20)
    const lineasNota = notas.trim() ? partir(notas.trim(), cursiva, tamNota, anchoUtil - 20 - 20) : []
    let pendientes = lineasNota
    let primero = true
    while (primero || pendientes.length) {
      const altoTitulo = lineasTitulo.length * interTitulo
      const minimo = 10 + altoTitulo + (pendientes.length ? 14 + interNota + 10 : 0) + 10
      cabe(minimo)
      const disponible = y - ABAJO - (10 + altoTitulo + 14 + 10 + 10)
      const caben = Math.max(1, Math.floor(disponible / interNota))
      const trozo = pendientes.slice(0, caben)
      pendientes = pendientes.slice(trozo.length)
      const altoBocadillo = trozo.length ? trozo.length * interNota + 10 : 0
      const alto = 10 + altoTitulo + (trozo.length ? 14 + altoBocadillo : 0) + 10
      pagina.drawRectangle({ x: IZQ, y: y - alto, width: anchoUtil, height: alto, color, rotate: degrees(giro) })
      let cursor = y - 10 - tamTitulo + 1
      lineasTitulo.forEach((linea, i) => {
        const texto = !primero && i === lineasTitulo.length - 1 ? `${linea} (cont.)` : linea
        pagina.drawText(texto, { x: IZQ + 10, y: cursor, size: tamTitulo, font: negrita, color: c.tinta })
        cursor -= interTitulo
      })
      if (trozo.length) {
        // Tira de papel blanca pegada con cinta de color dentro del post-it.
        const bx = IZQ + 10
        const by = y - 10 - altoTitulo - 10
        const bw = anchoUtil - 20
        pagina.drawRectangle({ x: bx, y: by - altoBocadillo, width: bw, height: altoBocadillo, color: c.blanco, rotate: degrees(0.5) })
        pagina.drawRectangle({ x: bx + 14, y: by - 4, width: 40, height: 10, color: cinta, opacity: 0.9, rotate: degrees(-6) })
        let yn = by - 5 - tamNota + 1
        for (const linea of trozo) {
          pagina.drawText(linea, { x: bx + 10, y: yn, size: tamNota, font: cursiva, color: c.tinta })
          yn -= interNota
        }
      }
      y -= alto + 14
      primero = false
    }
  }

  datos.puntos.forEach((p, i) => postit(`${i + 1}. ${p.titulo}`, p.notas, postits[i % postits.length], [-0.8, 0.6, -0.4, 0.5, -0.7][i % 5], postits[(i + 2) % postits.length]))
  if (datos.notasGenerales?.texto.trim()) postit(datos.notasGenerales.titulo, datos.notasGenerales.texto, postits[0], 0.4, postits[2])

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
