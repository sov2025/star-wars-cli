FROM node:24-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

# Set default environment
ENV NODE_ENV=production

# Run the application
CMD ["pnpm", "start"]