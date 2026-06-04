FROM node:18-alpine AS frontend-build

WORKDIR /app
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:18-alpine

ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 4000
CMD ["npm", "run", "start"]
