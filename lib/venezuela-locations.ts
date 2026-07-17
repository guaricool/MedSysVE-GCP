/**
 * Venezuela — 23 estados + ciudades principales.
 *
 * Source: Wikipedia / INE (Instituto Nacional de Estadística) 2024.
 * Each estado has its capital as the first ciudad in the list. Use this list
 * for dropdowns in clinic creation, doctor register, workspace settings,
 * and the referral doctor picker.
 *
 * NOTE: ciudades list is intentionally short (3-5 per estado). If a doctor
 * wants a ciudad not in the list, they can type it freeform — we store
 * whatever they type. The picker is for guidance, not a closed list.
 */

export interface EstadoVenezuela {
  /** Official name (e.g. "Distrito Capital"). */
  nombre: string
  /** ISO-like 2-letter code (e.g. "DC", "ZU"). For storage consistency. */
  codigo: string
  /** Capital + principales ciudades. */
  ciudades: string[]
}

export const ESTADOS_VENEZUELA: EstadoVenezuela[] = [
  { nombre: "Amazonas", codigo: "AM", ciudades: ["Puerto Ayacucho", "Maroa", "San Fernando de Atabapo"] },
  { nombre: "Anzoátegui", codigo: "AN", ciudades: ["Barcelona", "Puerto La Cruz", "El Tigre", "Cumaná (oriente)", "Anaco"] },
  { nombre: "Apure", codigo: "AP", ciudades: ["San Fernando de Apure", "Guasdualito", "Elorza", "Biruaca"] },
  { nombre: "Aragua", codigo: "AR", ciudades: ["Maracay", "Turmero", "La Victoria (limitrofe)", "Cagua", "Palo Negro"] },
  { nombre: "Barinas", codigo: "BA", ciudades: ["Barinas", "Barinitas", "Socopó", "Ciudad Bolivia"] },
  { nombre: "Bolívar", codigo: "BO", ciudades: ["Ciudad Bolívar", "Ciudad Guayana", "Upata", "Caicara del Orinoco", "El Callao"] },
  { nombre: "Carabobo", codigo: "CA", ciudades: ["Valencia", "Puerto Cabello", "Guacara", "Naguanagua", "San Diego"] },
  { nombre: "Cojedes", codigo: "CO", ciudades: ["San Carlos", "Tinaco", "Tinaquillo"] },
  { nombre: "Delta Amacuro", codigo: "DA", ciudades: ["Tucupita", "Pedernales"] },
  { nombre: "Distrito Capital", codigo: "DC", ciudades: ["Caracas"] },
  { nombre: "Falcón", codigo: "FA", ciudades: ["Coro", "Punto Fijo", "Puerto Cabello (vecino)", "La Vela de Coro", "Churuguara"] },
  { nombre: "Guárico", codigo: "GU", ciudades: ["San Juan de los Morros", "Calabozo", "Valle de la Pascua", "Altagracia de Orituco"] },
  { nombre: "Lara", codigo: "LA", ciudades: ["Barquisimeto", "Cabudare", "Carora", "Quíbor"] },
  { nombre: "Mérida", codigo: "ME", ciudades: ["Mérida", "El Vigía", "Mucuchíes", "Ejido"] },
  { nombre: "Miranda", codigo: "MI", ciudades: ["Los Teques", "Guarenas", "Guatire", "Baruta", "Chacao", "Sucre (miranda)", "Petare"] },
  { nombre: "Monagas", codigo: "MO", ciudades: ["Maturín", "Caripito", "Punta de Mata"] },
  { nombre: "Nueva Esparta", codigo: "NE", ciudades: ["La Asunción", "Porlamar", "Pampatar", "Juan Griego"] },
  { nombre: "Portuguesa", codigo: "PO", ciudades: ["Guanare", "Acarigua", "Araure", "Ospino"] },
  { nombre: "Sucre", codigo: "SU", ciudades: ["Cumaná", "Carúpano", "Güiria", "Mariguitar"] },
  { nombre: "Táchira", codigo: "TA", ciudades: ["San Cristóbal", "San Antonio del Táchira", "Rubio", "Táriba", "La Grita"] },
  { nombre: "Trujillo", codigo: "TR", ciudades: ["Trujillo", "Valera", "Boconó", "Socopó (trujillo)"] },
  { nombre: "La Guaira", codigo: "VA", ciudades: ["La Guaira", "Caraballeda", "Catia La Mar", "Maiquetía"] },
  { nombre: "Yaracuy", codigo: "YA", ciudades: ["San Felipe", "Yaritagua", "Chivacoa", "Nirgua"] },
  { nombre: "Zulia", codigo: "ZU", ciudades: ["Maracaibo", "Cabimas", "Ciudad Ojeda", "Mara", "San Francisco", "Maturín (occidente)"] },
]

/** Lookup by estado name (case-insensitive). Returns undefined if not found. */
export function getEstadoByName(nombre: string): EstadoVenezuela | undefined {
  const lc = nombre.toLowerCase().trim()
  return ESTADOS_VENEZUELA.find((e) => e.nombre.toLowerCase() === lc)
}

/** Lookup by estado code (case-insensitive). */
export function getEstadoByCode(codigo: string): EstadoVenezuela | undefined {
  return ESTADOS_VENEZUELA.find((e) => e.codigo.toLowerCase() === codigo.toLowerCase())
}

/** Returns ciudades for an estado, or empty array if estado not found. */
export function getCiudadesByEstado(nombre: string): string[] {
  return getEstadoByName(nombre)?.ciudades ?? []
}

/** Sentinel value for the "I haven't filled this in yet" case. */
export const UBICACION_PENDIENTE = "Sin especificar"
