FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# curl for Docker health checks
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the full node_modules tree from the builder (Prisma + all transitive
# deps for migrate deploy at startup).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Prisma 7 schema + migrations directory.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy prisma.config.ts (lives at the repo root, not inside prisma/).
# Prisma 7 uses it to resolve DATABASE_URL from the runtime env vars.
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Overlay the Next.js standalone build on top (replaces server.js and
# refreshes node_modules with the traced runtime deps).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ensure the nextjs user owns /app so it can run prisma migrate deploy
# (which writes to .prisma/ and reads prisma/ + prisma.config.ts).
RUN chown nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Apply pending Prisma migrations before starting the server.
# Coolify passes DATABASE_URL via 'docker run -e' so prisma.config.ts
# picks it up automatically.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]