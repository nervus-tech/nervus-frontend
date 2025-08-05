# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built app from build stage
COPY --from=build /app/build ./build

# Copy server file and services directory
COPY server.js ./
COPY --from=build /app/src/services ./src/services

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "server"] 