# Use Node.js LTS version
FROM node:22-alpine

# Install postgresql-client for health checks
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.4

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN pnpm db:generate

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3000

# Default command
CMD ["node", "dist/app.cjs"]
