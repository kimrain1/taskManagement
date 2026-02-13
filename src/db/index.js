import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

// Create SQLite database connection
const sqlite = new Database('data/data.db');

// Create Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export * from './schema.js';

// Export the raw SQLite instance for advanced operations
export const rawDb = sqlite;
