FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
# Increase timeout and retry logic
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# Development stage — Next.js dev server with HMR
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]

# Build stage — produces standalone output
FROM base AS build
COPY . .
RUN npm run build

# Production stage — minimal Next.js standalone server
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
CMD ["node", "server.js"]