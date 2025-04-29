FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy application code
COPY . .

# Install dependencies
RUN npm install

# Build the application (if you have a build step)
# RUN npm run build

# Command will be overridden by smithery.yaml
CMD ["node", "dist/stdio-server.js"]