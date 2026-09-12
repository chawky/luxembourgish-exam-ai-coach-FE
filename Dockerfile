FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# Nginx
# ├── serve Angular static files
# └── proxy API requests to Spring Boot
FROM nginx:alpine

# Local Docker Compose default
ENV BACKEND_URL=http://backend:8080

# nginx:alpine automatically runs envsubst on files
# inside /etc/nginx/templates/
COPY default.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist/sproochentest-coach/browser /usr/share/nginx/html