FROM node:20-alpine AS base

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
COPY package*.json ./
# Include prisma schema in base so it's available for generation
COPY prisma ./prisma/ 

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci

# Generate the client here so it exists in the 'base' node_modules
# Ensure your file is named schema.prisma or rename it here
RUN npx prisma generate

# Development stage
FROM base AS dev
RUN npm install -g @nestjs/cli prisma
COPY . .
CMD ["npm", "run", "start:dev"]

# Build stage
FROM base AS build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine  AS prod
WORKDIR /app
# Only copy the necessary production bits
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

CMD ["node", "dist/main"]