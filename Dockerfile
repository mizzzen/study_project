### STAGE 1: Build ###
FROM node:10.15-alpine as builder

RUN apk --no-cache add --virtual builds-deps build-base python

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm rebuild bcrypt --build-from-source

COPY . .

RUN npm run build && rm -R src

RUN npm prune --production && npm cache clean --force

### STAGE 2: Setup ###
FROM node:10.15-alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 4000

CMD ["npm", "start"]