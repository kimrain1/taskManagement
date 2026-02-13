/** @type {import('drizzle-kit').Config} */
export default {
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/data.db',
  },
};
