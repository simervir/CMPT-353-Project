# Use Node.js to build and serve the app
FROM node:18

WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Expose the React dev port
EXPOSE 3000

# Run React in dev mode
CMD ["npm", "start"]
