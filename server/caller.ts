import { appRouter } from "./routers/_app"
import { createContext } from "./trpc"

export async function createServerCaller() {
  const ctx = await createContext()
  return appRouter.createCaller(ctx)
}
