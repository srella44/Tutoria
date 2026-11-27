// PDF con el estado de las autorizaciones (y religión, si se elige) de toda la clase.
// Se genera en el dispositivo con pdf-lib; nada sale de él salvo el fichero que descarga el tutor.
import type { Alumno, EstadoAutorizacion, TipoAutorizacion } from '../data/types'

export interface ColumnaPdf {
  id: string // id de la autorización o 'religion'
  nombre: string
  tipo?: TipoAutorizacion
}

const COLOR: Record<EstadoAutorizacion | 'pendiente', [number, number, number]> = {
  si: [0.84, 0.95, 0.88],
  aviatges: [0.99, 0.93, 0.8],
  no: [0.98, 0.87, 0.87],
  pendiente: [1, 1, 1],
}
const TINTA: Record<EstadoAutorizacion | 'pendiente', [number, number, number]> = {
  si: [0.02, 0.45, 0.25],
  aviatges: [0.6, 0.35, 0.02],
  no: [0.65, 0.1, 0.1],
  pendiente: [0.55, 0.58, 0.62],
}

/** Helvetica (WinAnsi) no tiene todos los caracteres: se sustituyen los que faltan. */
const seguro = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/[^\x20-\x7E\xA0-\xFF]/g, '')

export async function pdfAutorizaciones({ titulo, subtitulo, cabeceraNombre, alumnos, columnas, etiqueta, religionSi, religionNo }: {
  titulo: string
  cabeceraNombre: string
  subtitulo: string
  alumnos: Alumno[]
  columnas: ColumnaPdf[]
  etiqueta: (e: EstadoAutorizacion | 'pendiente', tres?: boolean) => string
  religionSi: string
  religionNo: string
}): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold)
  doc.setTitle(seguro(titulo))
  doc.setCreator('TUTOR-ia')

  // Apaisado si hay muchas columnas.
  // Vertical (más filas por hoja); apaisada solo con muchas columnas.
  const apaisado = columnas.length > 7
  const [ancho, alto] = apaisado ? [841.89, 595.28] : [595.28, 841.89]
  const margen = 40
  const colN = 24
  const colNombre = Math.min(220, (ancho - 2 * margen - colN) * 0.4)
  const colDato = (ancho - 2 * margen - colN - colNombre) / Math.max(1, columnas.length)
  // Siempre en una sola hoja: la altura de las filas (y la letra) se ajusta al número de alumnos.
  const disponible = alto - 2 * margen - 48 - 30 - 14
  const filaAlto = Math.min(20, disponible / Math.max(1, alumnos.length))
  const letra = Math.max(5, Math.min(10, filaAlto * 0.5))
  const letraDato = Math.max(5, Math.min(9, filaAlto * 0.45))
  const baseTexto = (filaAlto - letra * 0.7) / 2
  const cab = 30

  const estado = (a: Alumno, c: ColumnaPdf): EstadoAutorizacion | 'pendiente' =>
    c.tipo ? a.autorizaciones?.[c.tipo.id] ?? 'pendiente' : a.religion ? 'si' : 'pendiente'
  const texto = (a: Alumno, c: ColumnaPdf) => {
    const e = estado(a, c)
    return c.tipo ? etiqueta(e, c.tipo.tresEstados) : e === 'si' ? religionSi : religionNo
  }
  const ajustar = (s: string, fuente: typeof normal, tam: number, max: number) => {
    let r = seguro(s)
    while (r.length > 1 && fuente.widthOfTextAtSize(r, tam) > max) r = r.slice(0, -1)
    return r.length < seguro(s).length ? `${r.slice(0, -1)}.` : r
  }

  const pagina = doc.addPage([ancho, alto])
  let y = alto - margen
  const linea = rgb(0.83, 0.88, 0.92)

  const cabecera = (primera: boolean) => {
    if (primera) {
      pagina.drawText(seguro(titulo), { x: margen, y: y - 16, size: 16, font: negrita, color: rgb(0.08, 0.16, 0.23) })
      pagina.drawText(seguro(subtitulo), { x: margen, y: y - 32, size: 10, font: normal, color: rgb(0.31, 0.39, 0.46) })
      y -= 48
    }
    pagina.drawRectangle({ x: margen, y: y - cab, width: ancho - 2 * margen, height: cab, color: rgb(0.08, 0.38, 0.48) })
    pagina.drawText('#', { x: margen + 6, y: y - 19, size: 9, font: negrita, color: rgb(1, 1, 1) })
    pagina.drawText(seguro(cabeceraNombre), { x: margen + colN + 4, y: y - 19, size: 9, font: negrita, color: rgb(1, 1, 1) })
    columnas.forEach((c, i) => {
      const t = ajustar(c.nombre, negrita, 9, colDato - 6)
      const w = negrita.widthOfTextAtSize(t, 9)
      pagina.drawText(t, { x: margen + colN + colNombre + i * colDato + (colDato - w) / 2, y: y - 19, size: 9, font: negrita, color: rgb(1, 1, 1) })
    })
    y -= cab
  }
  cabecera(true)

  alumnos.forEach((a, n) => {
    const base = y - filaAlto
    if (n % 2 === 1) pagina.drawRectangle({ x: margen, y: base, width: colN + colNombre, height: filaAlto, color: rgb(0.96, 0.97, 0.98) })
    pagina.drawText(String(n + 1), { x: margen + 6, y: base + baseTexto, size: letraDato, font: normal, color: rgb(0.31, 0.39, 0.46) })
    pagina.drawText(ajustar(`${a.apellidos}, ${a.nombre}`, normal, letra, colNombre - 8), { x: margen + colN + 4, y: base + baseTexto, size: letra, font: normal, color: rgb(0.08, 0.16, 0.23) })
    columnas.forEach((c, i) => {
      const e = estado(a, c)
      const x = margen + colN + colNombre + i * colDato
      const hueco = Math.min(1.5, filaAlto * 0.08)
      pagina.drawRectangle({ x: x + hueco, y: base + hueco, width: colDato - 2 * hueco, height: filaAlto - 2 * hueco, color: rgb(...COLOR[e]) })
      const t = ajustar(texto(a, c), negrita, letraDato, colDato - 8)
      const w = negrita.widthOfTextAtSize(t, letraDato)
      pagina.drawText(t, { x: x + (colDato - w) / 2, y: base + baseTexto, size: letraDato, font: negrita, color: rgb(...TINTA[e]) })
    })
    pagina.drawLine({ start: { x: margen, y: base }, end: { x: ancho - margen, y: base }, thickness: 0.5, color: linea })
    y = base
  })

  // Pie con número de página.
  const paginas = doc.getPages()
  paginas.forEach((p, i) => {
    const t = `TUTOR-ia · ${i + 1}/${paginas.length}`
    p.drawText(t, { x: ancho - margen - normal.widthOfTextAtSize(t, 8), y: margen - 18, size: 8, font: normal, color: rgb(0.55, 0.58, 0.62) })
  })
  const bytes = await doc.save()
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' })
}
