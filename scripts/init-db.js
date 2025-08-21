require('dotenv').config({ path: '.env.local' });
const { initializeDb } = require('../src/lib/db');

async function main() {
  console.log('Initializing database...');
  try {
    await initializeDb();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
}

main();
