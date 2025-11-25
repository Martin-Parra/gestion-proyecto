const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const pool = require('../src/db/connection');

(async () => {
  try {
    console.log('Usando configuración de conexión de src/db/connection.js');
    const alterQuery = `
      ALTER TABLE usuarios 
      MODIFY COLUMN rol ENUM('admin','trabajador','jefe_proyecto','administrador','miembro','ceo') NOT NULL;
    `;
    const [result] = await pool.promise().query(alterQuery);
    console.log('Rol "ceo" agregado al ENUM de usuarios');
    console.log(result);
    const [rows] = await pool.promise().query('DESCRIBE usuarios');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error al modificar la columna rol:', err);
    process.exit(1);
  }
})();
