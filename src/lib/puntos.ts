// Separa un texto pegado (p. ej. el orden del día de un correo) en puntos.
// «1. Aaa 2. Bbb 3) Ccc» o una línea por número → un punto por número.
// Sin numeración: una línea por punto. Una sola línea sin números: un punto.

const marca = /(^|\s)(\d{1,2})\s*[.)ºª:-]\s+/g
const vineta = /^\s*(?:[-–—•*·]|\d{1,2}\s*[.)ºª:-])\s+/

const limpiar = (texto: string) => texto.replace(/\s+/g, ' ').trim()

export function separarPuntos(texto: string): string[] {
  // Marcas numeradas consecutivas (1, 2, 3…); otras cifras se ignoran.
  const marcas: { inicio: number; fin: number }[] = []
  let siguiente = -1
  for (const m of texto.matchAll(marca)) {
    const numero = Number(m[2])
    if (siguiente !== -1 && numero !== siguiente) continue
    const inicio = (m.index ?? 0) + m[1].length
    marcas.push({ inicio, fin: (m.index ?? 0) + m[0].length })
    siguiente = numero + 1
  }

  if (marcas.length >= 2) {
    const puntos: string[] = []
    const antes = limpiar(texto.slice(0, marcas[0].inicio))
    // Un encabezado como «Ordre deth dia:» no es un punto.
    if (antes && !antes.endsWith(':')) puntos.push(antes)
    marcas.forEach((m, i) => {
      const punto = limpiar(texto.slice(m.fin, marcas[i + 1]?.inicio ?? texto.length))
      if (punto) puntos.push(punto)
    })
    return puntos
  }

  const lineas = texto.split(/\r?\n/).map((l) => limpiar(l.replace(vineta, ''))).filter(Boolean)
  if (lineas.length > 1) return lineas.filter((l, i) => !(i === 0 && l.endsWith(':')))
  return lineas
}
