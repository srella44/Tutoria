import type { Registro } from '../data/types'

const instante = (fecha: Date) => fecha.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
const escapar = (texto: string) => texto.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([;,])/g, '\\$1')

export function descargarCalendario(registros: Registro[], titulo: (r: Registro) => string) {
  const sello = instante(new Date())
  const eventos = registros.flatMap((r) => [
    'BEGIN:VEVENT',
    `UID:${r.id}@tutoria.pretzhet.app`,
    `DTSTAMP:${sello}`,
    `DTSTART:${instante(new Date(r.fecha))}`,
    `SUMMARY:${escapar(titulo(r))}`,
    'CLASS:PRIVATE',
    'END:VEVENT',
  ])
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tutoria//Calendario//ES', ...eventos, 'END:VCALENDAR', ''].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'tutoria.ics'
  enlace.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
