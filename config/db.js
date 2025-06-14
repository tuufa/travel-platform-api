const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'travel_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'travel_routes',
  password: process.env.DB_PASSWORD || 'travel_password',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;