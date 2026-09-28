FROM node:24-bookworm-slim AS build

WORKDIR /app

# Cache dependencies independently from application changes.
# Keep dependency install scripts enabled (Nuxt prepare and native build tools).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

WORKDIR /app

# Nitro's output includes the server and its runtime dependencies.
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
