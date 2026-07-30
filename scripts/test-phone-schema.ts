import { z } from "zod"

const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined))
  .pipe(
    z
      .string()
      .regex(/^[\d\s+\-()]{7,20}$/, "El teléfono debe tener entre 7 y 20 dígitos (ej: 0412-1234567)")
      .optional()
  )

function test(val: any) {
  const res = optionalPhoneSchema.safeParse(val)
  console.log(`Input: ${JSON.stringify(val)} ->`, res.success ? `✅ SUCCESS (${res.data})` : `❌ ERROR (${res.error.issues[0].message})`)
}

console.log("=== Testing optionalPhoneSchema ===")
test("")
test("   ")
test(undefined)
test(null)
test("04121234567")
test("+584121234567")
test("+58 (412) 123-4567")
test("0412-1234567")
test("123") // too short
test("invalid_phone_letters")
