// Iconos para las autorizaciones (el tutor elige uno al crearlas).
import { Bike, Bus, Camera, Car, Clock, FileText, Footprints, House, Mountain, Phone, Pill, ShieldCheck, Sun, Users, Utensils, Waves, type LucideIcon } from 'lucide-react'

export const ICONOS_AUTORIZACION: Record<string, LucideIcon> = {
  bus: Bus,
  sol: Sun,
  cubiertos: Utensils,
  camara: Camera,
  casa: House,
  pie: Footprints,
  piscina: Waves,
  medicina: Pill,
  coche: Car,
  bici: Bike,
  montana: Mountain,
  telefono: Phone,
  grupo: Users,
  escudo: ShieldCheck,
  reloj: Clock,
  documento: FileText,
}

export const iconoAutorizacion = (clave: string) => ICONOS_AUTORIZACION[clave] ?? ShieldCheck
