# Stage 1: Build Frontend (React + Vite)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client

# Cài đặt dependencies cho frontend
COPY client/package*.json ./
RUN npm install

# Copy source code frontend và build
COPY client/ ./
RUN npm run build

# Stage 2: Setup Backend (Node.js + Prisma + Local AI)
FROM node:18-alpine AS backend
WORKDIR /app

# Khai báo biến môi trường cho Production
ENV NODE_ENV=production
ENV PORT=5000

# Cài đặt dependencies cho backend
COPY package*.json ./
RUN npm install --production=false

# Copy Prisma schema và tự động generate client
COPY prisma/ ./prisma/
RUN npx prisma generate

# Copy toàn bộ mã nguồn backend và models AI
COPY server/ ./server/
COPY .env.example .env

# Copy file build từ frontend sang (Tùy chọn nếu muốn serve chung port)
COPY --from=frontend-builder /app/client/dist ./client/dist

# Expose port (5000)
EXPOSE 5000

# Khởi chạy server API và Local AI Pipeline
CMD ["npm", "start"]
