FROM node:22.17.1-alpine3.22

WORKDIR /app
COPY . .
RUN npm install

EXPOSE 3000
CMD ["npm", "start", "--host", "0.0.0.0"]
