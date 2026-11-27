// PDF del acta propia («popurrí»): Claustre, Cicle, Mentoria y amassades sin hoja oficial.
// «Libreta de classa»: pauta con margen rojo y cinta, título de etiquetadora, puntos en negrita y notas en cursiva sobre la pauta,
// Ahèrs con casilla sobre la pauta, logo de la escuela y sello «OK!». Se generan páginas nuevas si hace falta.
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
  const anchoUtil = ANCHO - IZQ - DER

  nuevaPagina()
  // Cinta adhesiva arriba y sello.
  pagina.drawRectangle({ x: ANCHO * 0.42, y: ALTO - 14, width: 90, height: 20, color: c.cinta, opacity: 0.85, rotate: degrees(-4) })
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
  // Libreta de classa: todo se escribe sobre la pauta. Punto en negrita; lo redactado, sangrado y en cursiva.
  const PRIMERA_PAUTA = ALTO - 72
  const siguientePauta = (desde: number) => PRIMERA_PAUTA - Math.ceil((PRIMERA_PAUTA - desde) / PAUTA) * PAUTA
  /** Escribe una línea apoyada en la pauta siguiente; salta de página si no cabe. Devuelve la línea base usada. */
  const renglon = (dibujar: (base: number) => void) => {
    let base = siguientePauta(y - 9) + 3
    if (base < ABAJO) {
      nuevaPagina()
      base = siguientePauta(y - 9) + 3
    }
    dibujar(base)
    y = base - 5
    return base
  }
  const punto = (titulo: string, notas: string) => {
    if (y - 2 * PAUTA < ABAJO) nuevaPagina()
    for (const linea of partir(titulo, negrita, tamTitulo, anchoUtil)) {
      renglon((base) => pagina.drawText(linea, { x: IZQ, y: base, size: tamTitulo, font: negrita, color: c.tinta }))
    }
    const lineasNota = notas.trim() ? partir(notas.trim(), cursiva, tamNota, anchoUtil - 18) : []
    for (const linea of lineasNota) {
      renglon((base) => { if (linea) pagina.drawText(linea, { x: IZQ + 18, y: base, size: tamNota, font: cursiva, color: c.tinta }) })
    }
    y -= PAUTA - 5
  }

  datos.puntos.forEach((p, i) => punto(`${i + 1}. ${p.titulo}`, p.notas))
  if (datos.notasGenerales?.texto.trim()) punto(datos.notasGenerales.titulo, datos.notasGenerales.texto)

  // Ahèrs: casilla dibujada, texto en negrita y responsable y fecha en gris, en la misma línea si cabe.
  if (datos.ahers?.items.length) {
    if (y - 3 * PAUTA < ABAJO) nuevaPagina()
    renglon((base) => pagina.drawText(limpio(datos.ahers!.titulo), { x: IZQ, y: base, size: 12, font: negrita, color: c.seccion }))
    for (const a of datos.ahers.items) {
      const detalle = a.detalle ? ` · ${limpio(a.detalle)}` : ''
      const lineas = partir(a.texto, negrita, 10.5, anchoUtil - 20 - normal.widthOfTextAtSize(detalle, 9.5))
      lineas.forEach((linea, k) => {
        renglon((base) => {
          if (k === 0) {
            pagina.drawRectangle({ x: IZQ, y: base - 1, width: 9, height: 9, borderColor: c.tinta, borderWidth: 1 })
            if (a.hecho) {
              pagina.drawLine({ start: { x: IZQ + 1.5, y: base + 4 }, end: { x: IZQ + 4, y: base + 1 }, thickness: 1.3, color: c.tinta })
              pagina.drawLine({ start: { x: IZQ + 4, y: base + 1 }, end: { x: IZQ + 8.5, y: base + 8 }, thickness: 1.3, color: c.tinta })
            }
          }
          pagina.drawText(linea, { x: IZQ + 16, y: base, size: 10.5, font: negrita, color: c.tinta })
          if (k === lineas.length - 1 && detalle) {
            pagina.drawText(detalle, { x: IZQ + 16 + negrita.widthOfTextAtSize(linea, 10.5), y: base, size: 9.5, font: normal, color: c.gris })
          }
        })
      })
    }
  }

  paginas.forEach((p, i) => {
    const texto = limpio(`${datos.pie} · ${i + 1}/${paginas.length}`)
    p.drawText(texto, { x: ANCHO - DER - normal.widthOfTextAtSize(texto, 8), y: 24, size: 8, font: normal, color: c.suave })
  })
  return doc.save()
}
