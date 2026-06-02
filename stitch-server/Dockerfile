FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY index.mjs watchdog.mjs ./

EXPOSE 3001

# Lance le serveur ET le watchdog en parallèle
CMD node index.mjs & node watchdog.mjs & wait
