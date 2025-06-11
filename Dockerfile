# Use a more specific Node.js 20 image for better security and reproducibility
FROM node:20-bookworm-slim

# Set the working directory in the container
WORKDIR /app

# Add node_modules/.bin to the PATH environment variable
# Use the recommended key="value" format for the ENV instruction
ENV PATH="/app/node_modules/.bin:${PATH}"

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application in development mode
# Use npx to ensure the 'next' command is found and executed correctly.
CMD ["npx", "next", "dev"]
