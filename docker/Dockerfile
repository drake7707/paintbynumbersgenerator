FROM node:8-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3001
EXPOSE 10001

CMD npm start

