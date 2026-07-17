import type { SessionUser } from "@/types"

declare module "next-auth" {
  interface Session {
    user: SessionUser
  }
}

declare module "next-auth/jwt" {
  interface JWT extends SessionUser {}
}
