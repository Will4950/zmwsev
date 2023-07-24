FROM node:lts-buster
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
WORKDIR /usr/src/app
COPY . .
RUN npm install
CMD ["dumb-init", "node", "index.js"]
