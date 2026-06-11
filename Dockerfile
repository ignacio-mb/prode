# Single-stage image kept intentionally simple so the migrate + seed scripts
# (which run via tsx) are available at container start. Good enough for a
# small private app; optimize to a multi-stage standalone build later if needed.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the source and build.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Migrate + idempotent seed, then start. Overridable via compose `command`.
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]
