FROM node:18-alpine
WORKDIR /app
COPY package.json ./
<<<<<<< HEAD
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
=======
RUN npm i --silent
COPY src ./src
ENV PORT=4000
EXPOSE 4000
CMD ["npm","run","start"]
>>>>>>> 224c71b (Initial commit - Ocean Hazard Platform Backend)
