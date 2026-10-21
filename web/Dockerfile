# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; npm ci
FROM dependencies AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
RUN npm run build
FROM node:24-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
RUN rm -rf /usr/local/lib/node_modules/npm && rm -f /usr/local/bin/npm /usr/local/bin/npx
USER node
EXPOSE 3000
CMD ["node","server.js"]
FROM node:24-bookworm-slim AS worker
WORKDIR /app
COPY --chown=node:node worker/package.json worker/package-lock.json ./
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; npm ci --omit=dev
COPY --chown=node:node scripts/email-worker.ts ./scripts/email-worker.ts
RUN rm -rf /usr/local/lib/node_modules/npm && rm -f /usr/local/bin/npm /usr/local/bin/npx
USER node
CMD ["node","scripts/email-worker.ts"]
