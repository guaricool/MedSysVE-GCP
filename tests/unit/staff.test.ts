import { describe, it, expect } from "vitest"

describe("staff PIN validation", () => {
  it("PIN must be at least 6 characters", () => {
    const validatePin = (pin: string) => pin.length >= 6
    expect(validatePin("12345")).toBe(false)
    expect(validatePin("123456")).toBe(true)
  })
})
