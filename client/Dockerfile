# Use Node.js for building the React app
FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
