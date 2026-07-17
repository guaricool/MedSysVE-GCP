import { describe, it, expect } from "vitest"

describe("patient ID display generation", () => {
  it("pads ID to 6 digits", () => {
    const formatId = (n: number) => String(n).padStart(6, "0")
    expect(formatId(1)).toBe("000001")
    expect(formatId(54)).toBe("000054")
    expect(formatId(999999)).toBe("999999")
  })
})

describe("minor patient validation", () => {
  it("requires representative when sinCedula is true", () => {
    const validate = (sinCedula: boolean, repCedula?: string) => {
      if (sinCedula && !repCedula) return "Representante requerido"
      return null
    }
    expect(validate(true, undefined)).toBe("Representante requerido")
    expect(validate(true, "V-12345678")).toBeNull()
    expect(validate(false, undefined)).toBeNull()
  })
})
