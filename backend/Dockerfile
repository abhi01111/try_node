FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm prune --omit=dev




FROM node:20-alpine
WORKDIR /app
COPY --from=build /app /app

EXPOSE 5003

ENTRYPOINT ["sh","/app/entrypoint.sh"]
CMD ["npm","start"]

