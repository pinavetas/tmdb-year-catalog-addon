# ==========================================
# 1. Etapa de Compilación (Builder)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias completas
COPY package*.json tsconfig.json ./
RUN npm ci

# Copiar código fuente y compilar TypeScript + vistas
COPY src/ ./src/
RUN npm run build

# ==========================================
# 2. Etapa de Producción (Runner)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7000
ENV HOST=0.0.0.0

# Copiar solo archivos de dependencias e instalar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar archivos compilados y vistas desde la etapa builder
COPY --from=builder /app/dist ./dist

# Usuario sin privilegios por seguridad
USER node

EXPOSE 7000

CMD ["node", "dist/index.js"]
