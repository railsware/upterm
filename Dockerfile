FROM node:6.10.3

RUN mkdir /upterm
WORKDIR /upterm

COPY package.json .
COPY .npmrc .

RUN npm install

COPY . /upterm

RUN npm run pack

