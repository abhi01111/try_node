# Stage 1 — Build React
FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


# Stage 2 — Serve with Nginx
FROM nginx:alpine

# Copy our nginx.conf into the container (THIS IS THE IMPORTANT PART)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy React build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
