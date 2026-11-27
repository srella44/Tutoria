import type { PDFFont, PDFPage, RGB } from 'pdf-lib'

export type ModeloOficial = 'familia' | 'escoti'
type Caja = readonly [pagina: number, x: number, y: number, ancho: number, alto: number]

const modelos = {
  familia: {
    nombre: "Huelha d'entrevista.pdf",
    hash: '3bd166a1e45534d9909d3e821edd4d2c53b7f58fecfd5e35b19b64507fe2d71c',
    campos: {
      alumno: [0, 239, 141, 542, 21],
      fecha: [0, 115, 177, 247, 20],
      curso: [0, 456, 175, 94, 19],
      clase: [0, 674, 175, 93, 19],
      docente: [0, 150, 219, 407, 21],
      asistentes: [0, 160, 260, 623, 20],
      aspectos: [0, 72, 532, 700, 297],
      acuerdos: [0, 82, 880, 692, 129],
    },
    firmas: [[0, 85, 1055, 285, 71], [0, 511, 1055, 255, 71]],
  },
  escoti: {
    nombre: "T'ESCOTI.pdf",
    hash: 'fe81be9a61bca1d4153d2071de7116bc244d7991f6cd0286b578ff04c449fd7b',
    campos: {
      alumno: [0, 214, 141, 541, 21],
      curso: [0, 87, 182, 91, 20],
      clase: [0, 275, 182, 91, 20],
      fecha: [0, 90, 222, 247, 19],
      docente: [0, 124, 260, 410, 20],
      q0: [0, 56, 384, 708, 22],
      q1: [0, 56, 423, 708, 22],
      q2: [0, 56, 462, 708, 22],
      q3: [0, 56, 501, 708, 22],
      q4: [0, 56, 540, 708, 18],
      q5: [0, 56, 656, 708, 22],
      q6: [0, 56, 696, 708, 22],
      q7: [0, 56, 735, 708, 22],
      q8: [0, 56, 773, 708, 22],
      q9: [0, 56, 812, 708, 22],
      q10: [0, 56, 851, 708, 19],
      q11: [1, 56, 115, 708, 22],
      q12: [1, 56, 155, 708, 22],
      q13: [1, 56, 194, 708, 22],
      q14: [1, 56, 232, 708, 22],
      q15: [1, 56, 272, 708, 20],
      propuestas: [1, 55, 392, 705, 53],
      acuerdos: [1, 55, 548, 705, 54],
    },
    firmas: [[1, 38, 699, 330, 111]],
  },
} satisfies Record<ModeloOficial, { nombre: string; hash: string; campos: Record<string, Caja>; firmas: Caja[] }>

const casillasFamilia = [[70, 360], [70, 406], [70, 452], [407, 360], [407, 406], [407, 452]] as const

export async function comprobarOriginal(modelo: ModeloOficial, bytes: ArrayBuffer) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('') === modelos[modelo].hash
}

export function plantillaIncluida(modelo: ModeloOficial): Uint8Array | undefined {
  const contenido = document.getElementById('tutoria-pdfs-privados')?.textContent
  if (!contenido) return
  const datos = (JSON.parse(contenido) as Partial<Record<ModeloOficial, string>>)[modelo]
  return datos ? Uint8Array.from(atob(datos), (caracter) => caracter.charCodeAt(0)) : undefined
}

export function nombreOficial(modelo: ModeloOficial) {
  return modelos[modelo].nombre
}

export class CampoPdfError extends Error {
  campo: string
  constructor(campo: string) {
    super(campo)
    this.campo = campo
  }
}

// Las cajas se midieron sobre una vista de referencia de 814 × 1150, con origen arriba.
function medidas(pagina: PDFPage, [, izquierda, arriba, ancho, alto]: Caja) {
  const { x, y, width, height } = pagina.getCropBox()
  return { x: x + izquierda * width / 814, y: y + height - arriba * height / 1150, ancho: ancho * width / 814, alto: alto * height / 1150 }
}

function lineas(texto: string, fuente: PDFFont, tamano: number, ancho: number) {
  const resultado: string[] = []
  for (const parrafo of texto.split(/\r?\n/)) {
    let linea = ''
    for (const palabra of parrafo.trim().split(/\s+/)) {
      const candidata = linea ? `${linea} ${palabra}` : palabra
      if (linea && fuente.widthOfTextAtSize(candidata, tamano) > ancho) {
        resultado.push(linea)
        linea = palabra
      } else {
        linea = candidata
      }
    }
    resultado.push(linea)
  }
  return resultado
}

function escribir(pagina: PDFPage, caja: Caja, valor: string, fuente: PDFFont, clave: string, tinta: RGB) {
  const { x, y, ancho, alto } = medidas(pagina, caja)
  const texto = valor.trim().normalize('NFC')
  if (!texto) return
  try {
    const unaLinea = caja[4] <= 21 && !clave.startsWith('q')
    for (let tamano = 10; tamano >= 7; tamano -= 0.5) {
      const partes = unaLinea ? [texto.replace(/\s+/g, ' ')] : lineas(texto, fuente, tamano, ancho)
      const interlinea = tamano * 1.08
      if (partes.length * interlinea > alto || partes.some((linea) => fuente.widthOfTextAtSize(linea, tamano) > ancho)) continue
      partes.forEach((linea, i) => {
        if (linea) pagina.drawText(linea, { x, y: y - tamano - i * interlinea, font: fuente, size: tamano, color: tinta })
      })
      return
    }
  } catch {
    // Un carácter que la fuente oficial de salida no puede representar se señala como campo inválido.
  }
  throw new CampoPdfError(clave)
}

export type PuntoPdf = { titulo: string; notas: string }

type Fuentes = { normal: PDFFont; negrita: PDFFont; cursiva: PDFFont }

/** «Aspèctes a tractar» por puntos: título numerado en negrita y desarrollo sangrado en cursiva. */
function escribirPuntos(pagina: PDFPage, caja: Caja, puntos: PuntoPdf[], fuentes: Fuentes, clave: string, tinta: RGB) {
  const { x, y, ancho, alto } = medidas(pagina, caja)
  try {
    for (let tamano = 10; tamano >= 7; tamano -= 0.5) {
      const interlinea = tamano * 1.08
      const sangria = tamano * 1.6
      const filas: { texto: string; fuente: PDFFont; x: number }[][] = puntos.map((p, i) => [
        ...lineas(`${i + 1}. ${p.titulo}`.normalize('NFC'), fuentes.negrita, tamano, ancho)
          .map((texto) => ({ texto, fuente: fuentes.negrita, x })),
        ...(p.notas.trim() ? lineas(p.notas.trim().normalize('NFC'), fuentes.cursiva, tamano, ancho - sangria) : [])
          .map((texto) => ({ texto, fuente: fuentes.cursiva, x: x + sangria })),
      ])
      const separacion = interlinea * 0.5
      const total = filas.reduce((suma, f) => suma + f.length * interlinea, 0) + separacion * (filas.length - 1)
      if (total > alto) continue
      let cursor = y - tamano
      filas.forEach((punto) => {
        punto.forEach((fila) => {
          if (fila.texto) pagina.drawText(fila.texto, { x: fila.x, y: cursor, font: fila.fuente, size: tamano, color: tinta })
          cursor -= interlinea
        })
        cursor -= separacion
      })
      return
    }
  } catch {
    // Carácter no representable: se señala como campo inválido.
  }
  throw new CampoPdfError(clave)
}

export async function rellenarPdfOficial(
  modelo: ModeloOficial,
  original: Uint8Array,
  valores: Record<string, string>,
  motivos: number[],
  firmas: (string | undefined)[],
  /** Sello al pie de cada página del acta definitiva (versión y fecha de firma). */
  sello?: string,
  /** Puntos preparados: sustituyen el texto de «aspectos» con formato propio. */
  puntos?: PuntoPdf[],
) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const tinta = rgb(0.07, 0.18, 0.31)
  const documento = await PDFDocument.load(original, { updateMetadata: false })
  const paginas = documento.getPages()
  const fuente = await documento.embedFont(StandardFonts.Helvetica)
  for (const [clave, caja] of Object.entries(modelos[modelo].campos)) {
    if (clave === 'aspectos' && puntos?.length) {
      const fuentes = {
        normal: fuente,
        negrita: await documento.embedFont(StandardFonts.HelveticaBold),
        cursiva: await documento.embedFont(StandardFonts.HelveticaOblique),
      }
      escribirPuntos(paginas[caja[0]], caja, puntos, fuentes, clave, tinta)
      continue
    }
    escribir(paginas[caja[0]], caja, valores[clave] ?? '', fuente, clave, tinta)
  }
  if (modelo === 'familia') {
    for (const motivo of motivos) {
      const [x, y] = casillasFamilia[motivo]
      const pagina = paginas[0]
      const m = medidas(pagina, [0, x + 5, y + 6, 19, 17])
      const inicio = { x: m.x, y: m.y - m.alto * 0.5 }
      const medio = { x: m.x + m.ancho * 0.35, y: m.y - m.alto }
      const final = { x: m.x + m.ancho, y: m.y }
      pagina.drawLine({ start: inicio, end: medio, thickness: 1.45, color: tinta })
      pagina.drawLine({ start: medio, end: final, thickness: 1.45, color: tinta })
    }
  }
  for (const [i, caja] of modelos[modelo].firmas.entries()) {
    const firma = firmas[i]
    if (!firma) continue
    const imagen = await documento.embedPng(firma)
    const pagina = paginas[caja[0]]
    const m = medidas(pagina, caja)
    const tamano = imagen.scaleToFit(m.ancho, m.alto)
    pagina.drawImage(imagen, { x: m.x, y: m.y - tamano.height, ...tamano })
  }
  if (sello) {
    for (const pagina of paginas) {
      const { x, y, width } = pagina.getCropBox()
      const texto = sello.normalize('NFC').replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
      const ancho = fuente.widthOfTextAtSize(texto, 7)
      pagina.drawText(texto, { x: x + width - ancho - 18, y: y + 10, size: 7, font: fuente, color: rgb(0.45, 0.5, 0.55) })
    }
    documento.setProducer('TUTOR-ia')
    documento.setModificationDate(new Date())
  }
  return documento.save()
}
