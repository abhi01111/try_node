FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm prune --omit=dev




FROM node:20-alpine
# RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*
WORKDIR /app
COPY --from=build /app /app

RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

EXPOSE 5003

ENTRYPOINT ["sh","/app/entrypoint.sh"]
CMD ["node","server.js"]

