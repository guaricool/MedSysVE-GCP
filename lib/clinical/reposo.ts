export function calcularFechaFin(inicio: Date, dias: number): Date {
  const d = new Date(inicio)
  d.setDate(d.getDate() + Math.max(0, dias - 1))
  return d
}
