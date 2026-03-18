FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_SPRING_API_URL=http://localhost:8080/api
ARG VITE_ASPNET_API_URL=http://localhost:5107/api
ARG VITE_NODE_API_URL=http://localhost:4000/api
ARG VITE_REPORTS_ADMIN_KEY=dev-admin-key-change-me

ENV VITE_SPRING_API_URL=$VITE_SPRING_API_URL
ENV VITE_ASPNET_API_URL=$VITE_ASPNET_API_URL
ENV VITE_NODE_API_URL=$VITE_NODE_API_URL
ENV VITE_REPORTS_ADMIN_KEY=$VITE_REPORTS_ADMIN_KEY

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80