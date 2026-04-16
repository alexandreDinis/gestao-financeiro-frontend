# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependências (cache)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copiar arquivos do projeto
COPY . .

# Argumentos de build para o Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:8087/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Gerar build de produção
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar apenas o necessário para rodar
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "run", "start"]
