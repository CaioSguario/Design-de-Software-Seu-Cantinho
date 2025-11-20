FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build || echo "Ignorando build (modo dev)"

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]

