FROM node:8.11.0

RUN mkdir /upterm
WORKDIR /upterm

COPY package.json .
COPY .npmrc .

RUN npm install
COPY . /upterm
RUN npm run pack

VOLUME /dist
CMD cp /upterm/dist/*.AppImage /dist
