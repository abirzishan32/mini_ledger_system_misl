# syntax=docker/dockerfile:1

# Dependencies in their own stage, so they are re-installed only when the
# lockfile changes rather than on every source edit.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# ci, not install: installs exactly the lockfile and fails if the two disagree,
# which is what makes the image reproducible.
RUN npm ci

# Build stage. devDependencies are needed here — next, typescript, tailwind and
# postcss all run during the build and none of them ship to the runtime.
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime stage. Carries the standalone output and nothing else: no source, no
# build tooling, and only the dependencies Next traced as actually reachable.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# server.js and its traced node_modules, then the static assets it serves.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# 0.0.0.0, not localhost: the server has to accept connections from outside its
# own container, which the default binding would refuse.
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
