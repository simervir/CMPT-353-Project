# Use Node.js for building the React app
FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use NGINX to serve the static files
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Expose React port (optional if behind proxy)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
