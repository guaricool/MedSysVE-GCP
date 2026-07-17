export interface Vitales {
  taSistolica?: number
  taDiastolica?: number
  fc?: number
  fr?: number
  temperatura?: number
  peso?: number
  talla?: number
  spo2?: number
  glasgow?: number
}

export type AlertLevel = "normal" | "red"

export function evaluarVital(campo: keyof Vitales, valor: number | undefined): AlertLevel {
  if (valor === undefined || valor === null || Number.isNaN(valor)) return "normal"
  switch (campo) {
    case "taSistolica":
      return valor > 180 || valor < 90 ? "red" : "normal"
    case "taDiastolica":
      return valor > 120 || valor < 60 ? "red" : "normal"
    case "fc":
      return valor > 100 || valor < 50 ? "red" : "normal"
    case "fr":
      return valor > 20 || valor < 12 ? "red" : "normal"
    case "temperatura":
      return valor > 38.5 || valor < 35 ? "red" : "normal"
    case "spo2":
      return valor < 93 ? "red" : "normal"
    case "glasgow":
      return valor < 8 ? "red" : "normal"
    default:
      return "normal"
  }
}
