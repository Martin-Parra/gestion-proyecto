const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const pool = require('../src/db/connection');

(async () => {
  try {
    console.log('DB_HOST', process.env.DB_HOST);
    console.log('DB_USER', process.env.DB_USER);
    console.log('DB_NAME', process.env.DB_NAME);
    const [userRow] = await pool.promise().query('SELECT USER(), CURRENT_USER(), DATABASE()');
    console.table(userRow);
    const [ping] = await pool.promise().query('SELECT 1 AS ok');
    console.table(ping);
    process.exit(0);
  } catch (err) {
    console.error('Error de conexión:', err);
    process.exit(1);
  }
})();

