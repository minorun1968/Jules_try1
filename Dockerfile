# Use Node.js 20 as the base image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# If package-lock.json is not used, you might need to adjust this
# For npm, it's package-lock.json. For yarn, it's yarn.lock.
# Assuming npm is used based on package.json scripts.
COPY package.json ./
# COPY package-lock.json ./

# Install dependencies
# Using --omit=dev for a smaller production image, but for dev mode, devDependencies might be needed.
# The issue specifies "development mode", so we should install all dependencies.
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application in development mode
CMD ["npm", "run", "dev"]
