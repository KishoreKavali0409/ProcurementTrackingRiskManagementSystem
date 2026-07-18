# Use official Node.js runtime as parent image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy codebase
COPY . .

# Expose port
EXPOSE 3000

# Start application in development mode
CMD ["npm", "run", "dev"]
