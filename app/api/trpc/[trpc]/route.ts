import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/routers/_app"
import { createContext } from "@/server/trpc"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError: ({ path, error }) => {
      console.error(`❌ tRPC failed on ${path ?? "<no-path>"}:`, error);
    },
  })

export { handler as GET, handler as POST }
