
FROM node:14.17.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci


FROM node:14.17.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Compile frontend and server
RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "production"]
COPY . .

EXPOSE 8000

CMD ["npm", "run", "production"]
