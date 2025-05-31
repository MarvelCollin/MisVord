FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies - use npm ci for more reliable builds
RUN npm ci || npm install

# Copy source code
COPY . .

# Expose socket port
EXPOSE 1002

# Command to run the app
CMD ["node", "server.js"] 