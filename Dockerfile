# Stage 1: Build the React Application
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools (needed for better-sqlite3, tensorflow)
RUN apk add --no-cache python3 make g++

# Install root dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# Install client dependencies
COPY client/package*.json ./client/
RUN cd client && npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Build the React client
RUN cd client && npm run build

# Train the NLP chatbot model (generates model.nlp)
RUN node server/src/jobs/train_nlp.js

# Stage 2: Production Server
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy Prisma schema first (required before generate)
COPY prisma ./prisma

# Copy package files and install production deps
COPY package*.json ./
RUN npm install --production --legacy-peer-deps --ignore-scripts

# Generate Prisma client
RUN npx prisma generate

# Copy built React app (server serves from client/dist)
COPY --from=builder /app/client/dist ./client/dist

# Copy server source code
COPY server ./server

# Copy static data files (curriculum, syllabus, chatbot data, etc.)
COPY --from=builder /app/server/data ./server/data

# Copy trained NLP model
COPY --from=builder /app/server/src/ai/models/nlp/chatbot_model.nlp ./server/src/ai/models/nlp/chatbot_model.nlp

# Expose API port
EXPOSE 3000

# Initialize DB schema, seed data, and start server
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node server/server.js"]
