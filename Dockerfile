FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g sequelize-cli

COPY . .

EXPOSE 4001

CMD ["node", "src/server.js"]