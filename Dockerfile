# =========================================================================
# STAGE 1: Build the application
# =========================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies required for building)
RUN npm ci

# Copy the source code
COPY . .

# Build the Angular SSR application
RUN npm run build

# =========================================================================
# STAGE 2: Serve the application using a lightweight runtime
# =========================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Copy built assets from build stage
COPY --from=build /app/dist /app/dist

# Expose the SSR server port
EXPOSE 4000

# Run the Express SSR server
CMD ["node", "dist/Multiservicio_rafael/server/server.mjs"]
