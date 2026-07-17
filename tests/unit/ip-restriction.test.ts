import { describe, it, expect } from "vitest"

// Simulate the IP check logic implemented in the proxy
function isIpAllowed(clientIp: string, allowedIps: string | null): boolean {
  if (!allowedIps) return true
  const allowedList = allowedIps.split(",").map((ip) => ip.trim()).filter(Boolean)
  return allowedList.includes(clientIp)
}

describe("allowedIps verification", () => {
  it("should allow any IP if allowedIps is null or empty", () => {
    expect(isIpAllowed("190.45.67.89", null)).toBe(true)
    expect(isIpAllowed("190.45.67.89", "")).toBe(true)
  })

  it("should allow client IP if it is in the allowed list", () => {
    expect(isIpAllowed("190.45.67.89", "190.45.67.89, 200.12.34.56")).toBe(true)
  })

  it("should block client IP if it is NOT in the allowed list", () => {
    expect(isIpAllowed("190.45.67.90", "190.45.67.89, 200.12.34.56")).toBe(false)
  })
})
