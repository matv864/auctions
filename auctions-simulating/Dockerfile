FROM node:latest

WORKDIR /opt/app-root/src

# Copy package.json and package-lock.json
COPY package.json ./

# Install npm production packages 
RUN npm install


COPY . .
RUN npm run build

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]