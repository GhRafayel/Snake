FROM node:22-alpine AS base

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN npm install -g npm@11.6.2
COPY package*.json ./
# Include prisma schema in base so it's available for generation
COPY prisma ./prisma/

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci


RUN npx prisma generate

# Development stage
FROM base AS dev
COPY . .
CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine  AS prod
WORKDIR /app
# Only copy the necessary production bits
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

CMD ["node", "dist/src/main"]