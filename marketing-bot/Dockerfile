FROM ghcr.io/puppeteer/puppeteer:latest

USER root

# Install TypeScript globally for building or use local devDependencies
WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies (including devDependencies for building)
RUN npm install

COPY . .

# Build the project
RUN npm run build

# Switch to the node user for security
USER pptruser

# Install chrome specifically
RUN npx puppeteer browsers install chrome

# Expose port (Cloud Run requires a port to be exposed, though this is a job, it's good practice)
EXPOSE 8080

CMD ["npm", "start"]
