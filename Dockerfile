FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0 MERLIN_DATA_DIR=/var/data
RUN mkdir -p /var/data
EXPOSE 3000
CMD ["node","server.js"]
