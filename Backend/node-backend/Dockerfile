FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=development
ENV PORT=4000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE 4000

CMD ["node", "src/server.js"]