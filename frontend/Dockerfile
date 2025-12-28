FROM node:22.17.1-alpine3.22

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start", "--host", "0.0.0.0"]
