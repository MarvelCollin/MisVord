FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci || npm install

COPY . .

EXPOSE 1002

CMD ["node", "server.js"]