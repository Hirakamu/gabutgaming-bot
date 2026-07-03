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

# Real ffmpeg from Alpine's repo instead of ffmpeg-static's postinstall
# download (that fetch hits GitHub release assets and is a common build
# failure point on hosts with restricted egress). FFMPEG_BIN is
# ffmpeg-static's own override var: with it set, requiring the package
# just returns this path instead of touching the network.
RUN apk add --no-cache ffmpeg
ENV FFMPEG_BIN=/usr/bin/ffmpeg

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

# data/ holds playlists.json (written at runtime); music/ is the local
# track library. Both are mounted as volumes, not baked into the image.
RUN mkdir -p data music && chown -R node:node /app
USER node

CMD ["node", "dist/index.js"]
