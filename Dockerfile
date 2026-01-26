# Multi-stage Dockerfile for Articulator Entitle App
# Stage 1: Build C++ binaries (encoder/decoder)
FROM ubuntu:22.04 as cpp-builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    libpng-dev \
    libjpeg-dev \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy C++ source files
COPY picode-scanner/backend/cpp_src ./cpp_src

# Build encoder and decoder
WORKDIR /app/cpp_src
# Update Makefile to use system libraries instead of homebrew
RUN sed -i 's|-I/opt/homebrew/include||g' Makefile && \
    sed -i 's|-L/opt/homebrew/lib||g' Makefile && \
    make all

# Stage 2: Build Next.js application
FROM node:20-alpine as nextjs-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Next.js application
RUN npm run build

# Stage 3: Setup backend Node.js service
FROM node:20-alpine as backend-builder

WORKDIR /app

# Copy backend package files
COPY picode-scanner/backend/package*.json ./

# Install backend dependencies
RUN npm ci --production

# Copy backend source and binaries
COPY picode-scanner/backend/server.js ./
COPY --from=cpp-builder /app/cpp_src/encoder ./encoder
COPY --from=cpp-builder /app/cpp_src/decoder ./decoder

# Create necessary directories
RUN mkdir -p public uploads

# Stage 4: Production image
FROM node:20-slim

# Install runtime dependencies for C++ binaries
RUN apt-get update && apt-get install -y \
    libpng16-16 \
    libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Next.js build from builder
COPY --from=nextjs-builder /app/.next ./.next
COPY --from=nextjs-builder /app/public ./public
COPY --from=nextjs-builder /app/package*.json ./
COPY --from=nextjs-builder /app/next.config.js ./
COPY --from=nextjs-builder /app/tsconfig.json ./
COPY --from=nextjs-builder /app/tailwind.config.js ./
COPY --from=nextjs-builder /app/postcss.config.js ./
COPY --from=nextjs-builder /app/app ./app
COPY --from=nextjs-builder /app/components ./components
COPY --from=nextjs-builder /app/lib ./lib
COPY --from=nextjs-builder /app/(auth) ./(auth)

# Install production dependencies for Next.js
RUN npm ci --production

# Copy backend from builder
COPY --from=backend-builder /app ./backend

# Create directories for backend
RUN mkdir -p backend/public backend/uploads

# Expose ports
# 3000 for Next.js, 3001 for backend API
EXPOSE 3000 3001

# Install a process manager for running multiple services
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# Create startup script
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
# Start backend service in background\n\
cd /app/backend\n\
node server.js &\n\
BACKEND_PID=$!\n\
\n\
# Start Next.js in background\n\
cd /app\n\
npm start &\n\
NEXTJS_PID=$!\n\
\n\
# Function to handle shutdown\n\
cleanup() {\n\
    echo "Shutting down services..."\n\
    kill $BACKEND_PID $NEXTJS_PID 2>/dev/null || true\n\
    wait $BACKEND_PID 2>/dev/null || true\n\
    wait $NEXTJS_PID 2>/dev/null || true\n\
    exit 0\n\
}\n\
\n\
# Trap signals\n\
trap cleanup SIGTERM SIGINT\n\
\n\
# Wait for both processes\n\
wait $BACKEND_PID $NEXTJS_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start both services using dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["/app/start.sh"]
