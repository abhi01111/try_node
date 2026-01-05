FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5003

ENTRYPOINT ["sh","/app/entrypoint.sh"]
CMD ["npm","start"]

