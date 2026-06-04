import { defineConfig } from '@prisma/config';

export default defineConfig({
  prisma: {
    schema: 'prisma/schema.prisma',
    seed: 'node prisma/seed.js',
  },
  datasource: {
    url: process.env.DATABASE_URL || "file:./prisma/dev.db",
  },
});
