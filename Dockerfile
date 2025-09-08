# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm config set legacy-peer-deps true && (test -f package-lock.json && npm ci --no-audit --no-fund || npm i --no-audit --no-fund)

# 프로젝트 소스 반영
COPY . .

# Vite React 플러그인 강제 설치(패키지에 없어도 보증)
RUN npm i -D @vitejs/plugin-react

# Vite 설정 파일이 없으면 SPA 기본 설정 생성
RUN test -f vite.config.ts || cat > vite.config.ts <<'EOT'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: 'dist/spa', sourcemap: false },
  server: { host: true, port: 5173 }
});
EOT

# SPA 빌드
RUN npm run build || npx vite build

# ---- runtime stage ----
FROM nginx:alpine
COPY --from=build /app/dist/spa /usr/share/nginx/html
EXPOSE 80
