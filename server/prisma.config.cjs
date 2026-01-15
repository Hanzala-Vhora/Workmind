require('dotenv').config();

module.exports = {
  schema: './prisma/schema.prisma',
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zhBMFLHWq78f@ep-broad-cherry-ahruev80-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
};
