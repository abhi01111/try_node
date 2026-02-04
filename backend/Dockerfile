FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

#RUN npm prune --omit=dev


FROM node:20-alpine
WORKDIR /app
COPY --from=build /app /app

RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

ENTRYPOINT ["sh","/app/entrypoint.sh"]
CMD ["node","server.js"]

