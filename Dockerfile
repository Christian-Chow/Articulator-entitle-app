# Stage 1: Frontend Dependencies
FROM node:20-alpine AS frontend-deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 2: Backend Builder (for C++ compilation)
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Install build dependencies for C++ compilation
RUN apk add --no-cache \
    g++ \
    gcc \
    make \
    libpng-dev \
    libjpeg-turbo-dev \
    musl-dev

# Copy backend source
COPY backend/package.json backend/package-lock.json* ./backend/
COPY backend/server.js ./backend/
COPY backend/nodemon.json ./backend/ 2>/dev/null || true
COPY backend/cpp_src ./backend/cpp_src

WORKDIR /app/backend

# Install backend Node.js dependencies
RUN npm ci --production

# Build C++ binaries (override Makefile paths for Alpine Linux)
WORKDIR /app/backend/cpp_src
RUN sed -i 's|-I/opt/homebrew/include||g' Makefile && \
    sed -i 's|-L/opt/homebrew/lib||g' Makefile && \
    make clean && \
    make

# Stage 3: Frontend Builder
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Copy dependencies from deps stage
COPY --from=frontend-deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Disable telemetry, linting, and type checking during build (Next.js env vars)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_DISABLE_ESLINT=1
ENV NEXT_DISABLE_TYPECHECK=1

# Set build arguments as environment variables (required for Next.js build)
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the application
RUN npm run build

# Stage 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies for C++ binaries
RUN apk add --no-cache \
    libpng \
    libjpeg-turbo \
    musl

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy frontend files from builder
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=frontend-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy backend files
COPY --from=backend-builder --chown=nextjs:nodejs /app/backend ./backend

# Create directories for backend
RUN mkdir -p backend/public backend/uploads && \
    chown -R nextjs:nodejs backend/public backend/uploads

# Create a startup script to run both servers
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
# Function to handle shutdown\n\
cleanup() {\n\
  echo "Shutting down..."\n\
  kill $BACKEND_PID 2>/dev/null || true\n\
  exit\n\
}\n\
\n\
trap cleanup SIGTERM SIGINT\n\
\n\
# Start backend server in background\n\
cd /app/backend\n\
node server.js &\n\
BACKEND_PID=$!\n\
\n\
# Start frontend server in foreground\n\
cd /app\n\
exec node server.js\n\
' > /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

USER nextjs

EXPOSE 8080 3001

ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["/bin/sh", "/app/start.sh"]
