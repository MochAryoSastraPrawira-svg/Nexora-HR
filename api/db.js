// Lightweight DB adapter scaffold for serverless deployment
// Currently this file is a scaffold showing where to add a Postgres adapter.
// To enable Postgres, install `pg` and implement the functions below.

const DATABASE_URL = process.env.DATABASE_URL || '';

const adapter = {
  isEnabled: !!DATABASE_URL,
  // Initialize connection pool (implement when using pg)
  async init() {
    if (!DATABASE_URL) return null;
    // Example implementation (uncomment after `npm install pg`):
    // const { Pool } = require('pg');
    // this.pool = new Pool({ connectionString: DATABASE_URL });
    // return this.pool;
    throw new Error('Postgres adapter not implemented. Install `pg` and implement `api/db.js` init().');
  },
  // Example read helper (should be replaced by real queries)
  async readAll(table) {
    if (!this.isEnabled) throw new Error('DB not enabled');
    throw new Error('readAll() not implemented for Postgres adapter.');
  },
  async write(table, data) {
    if (!this.isEnabled) throw new Error('DB not enabled');
    throw new Error('write() not implemented for Postgres adapter.');
  }
};

module.exports = adapter;
