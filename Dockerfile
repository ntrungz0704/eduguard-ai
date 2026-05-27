# Stage 1: Build the React Application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies for both client and server (using root package.json if monorepo, or separately)
RUN apk add --no-cache python3 make g++
COPY package*.json ./
COPY prisma ./prisma
COPY client/package*.json ./client/
RUN npm install --legacy-peer-deps
RUN cd client && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the client
RUN cd client && npm run build

# Stage 2: Production Server
FROM node:22-alpine

WORKDIR /app

# We only need production dependencies for the server
COPY package*.json ./
COPY prisma ./prisma
RUN apk add --no-cache python3 make g++
RUN npm install --production --legacy-peer-deps
RUN npx prisma generate

# Copy built assets from builder
COPY --from=builder /app/client/dist ./public

# Copy server code
COPY server ./server


# Expose API port
EXPOSE 3000

# Start server
CMD ["node", "server/server.js"]
