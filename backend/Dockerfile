# Backend Dockerfile para Railway — Multi-stage build
# Etapa 1: Build (incluye devDependencies para compilar TypeScript)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Instalar TODAS las dependencias (incluyendo devDeps para TypeScript)
RUN npm ci

# Copiar código fuente y compilar
COPY src ./src
RUN npm run build

# Etapa 2: Producción (solo lo necesario para ejecutar)
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

# Solo dependencias de producción
RUN npm ci --only=production

# Copiar el build compilado
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Iniciar servidor
CMD ["npm", "start"]
