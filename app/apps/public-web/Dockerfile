FROM oven/bun:1.3.5-alpine AS builder
WORKDIR /repo

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY app ./app

RUN bun install --frozen-lockfile

ARG NEXT_PUBLIC_API_PROXY_TARGET=http://api:8000
ARG NEXT_PUBLIC_BASE_URL=https://restorio.org
ARG NEXT_PUBLIC_PUBLIC_WEB_URL=https://restorio.org
ENV NEXT_PUBLIC_API_PROXY_TARGET=${NEXT_PUBLIC_API_PROXY_TARGET}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_PUBLIC_WEB_URL=${NEXT_PUBLIC_PUBLIC_WEB_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run turbo run build --filter=@restorio/public-web --concurrency=1

FROM oven/bun:1.3.5-alpine AS runner
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=builder /repo/package.json /repo/bun.lock ./
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/app/packages ./app/packages
COPY --from=builder /repo/app/apps/public-web ./app/apps/public-web

WORKDIR /repo/app/apps/public-web
EXPOSE 3000
CMD ["bun", "run", "start"]
