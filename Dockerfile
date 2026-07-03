# syntax=docker/dockerfile:1

# ---- Builder: install deps and compile TypeScript (src/ -> dist/) ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: skip ffmpeg-static's binary download here, it's not
# needed to run tsc and would just be discarded with this stage.
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime: production deps only + compiled output ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
# Scripts run here so ffmpeg-static fetches the linux binary for this image.
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# data/ holds playlists.json (written at runtime); music/ is the local
# track library. Both are mounted as volumes, not baked into the image.
RUN mkdir -p data music && chown -R node:node /app
USER node

CMD ["node", "dist/index.js"]
