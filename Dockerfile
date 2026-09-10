FROM node:20 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

#Nginx
#├── serve Angular static files
#└── proxy API requests to Spring Boot
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sproochentest-coach/browser /usr/share/nginx/html