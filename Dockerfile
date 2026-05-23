# Stage 1: Build the React Application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies for both client and server (using root package.json if monorepo, or separately)
COPY package*.json ./
COPY client/package*.json ./client/
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build the client
RUN cd client && npm run build

# Stage 2: Production Server
FROM node:18-alpine

WORKDIR /app

# We only need production dependencies for the server
COPY package*.json ./
RUN npm install --production

# Copy built assets from builder
COPY --from=builder /app/client/dist ./public

# Copy server code
COPY server ./server
COPY .env ./

# Expose API port
EXPOSE 3000

# Start server
CMD ["node", "server/server.js"]
