FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The private key is generated here on first start (see src/keys/generate-keys.ts).
# Mount a volume at /app/keys so it survives container restarts.
EXPOSE 4000
CMD ["node", "dist/index.js"]
