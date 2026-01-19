FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Forzamos node_modules clásico (no PnP)
RUN pnpm config set node-linker isolated

# Copiamos TODO el repo (para que pnpm vea el workspace completo)
COPY . .

# Instala deps del workspace
RUN pnpm -r install --frozen-lockfile
