FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/dist/Multiservicio_rafael ./dist/Multiservicio_rafael

EXPOSE 4000

USER node

CMD ["node", "dist/Multiservicio_rafael/server/server.mjs"]
