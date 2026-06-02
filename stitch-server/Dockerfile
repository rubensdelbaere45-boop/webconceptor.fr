FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY index.mjs ./

EXPOSE 3001

CMD ["node", "index.mjs"]
