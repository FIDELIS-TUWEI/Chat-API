FROM node:18-alpine

LABEL maintainer="fideliofidel9@gmail.com"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4001

CMD ["node", "src/server.js"]