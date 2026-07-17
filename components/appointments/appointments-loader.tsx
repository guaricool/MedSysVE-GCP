"use client"

import dynamic from "next/dynamic"

// ssr: false must live in a Client Component per Next.js 16 docs
const AppointmentsClient = dynamic(
  () => import("./appointments-client").then((m) => ({ default: m.AppointmentsClient })),
  { ssr: false },
)

export function AppointmentsLoader() {
  return <AppointmentsClient />
}
