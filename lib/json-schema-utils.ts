import { z } from "zod"

/**
 * Creates a defensive Zod schema for validating optional/nullable JSON string payloads.
 * Enforces maximum string character length and ensures valid JSON structure when non-empty.
 */
export function safeJsonStringSchema(maxLength = 32000) {
  return z
    .string()
    .max(maxLength, `El tamaño del payload JSON no puede exceder los ${maxLength} caracteres`)
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true
        try {
          JSON.parse(val)
          return true
        } catch {
          return false
        }
      },
      { message: "El formato de los datos debe ser una cadena JSON válida" }
    )
    .optional()
    .nullable()
}
