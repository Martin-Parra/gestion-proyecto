const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const pool = require('../src/db/connection');

(async () => {
  try {
    console.log('Comprobando ENUM de usuarios.rol con DB:', process.env.DB_NAME);
    const [rows] = await pool.promise().query(
      "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'rol'",
      [process.env.DB_NAME]
    );
    if (!rows || rows.length === 0) {
      console.log('No se encontró la columna rol en la tabla usuarios');
      process.exit(0);
    }
    const columnType = rows[0].COLUMN_TYPE; // e.g., enum('admin','trabajador',...)
    console.log('COLUMN_TYPE:', columnType);
    const match = columnType.match(/enum\((.*)\)/i);
    let values = [];
    if (match && match[1]) {
      values = match[1]
        .split(',')
        .map(v => v.trim().replace(/^'|"|\`|\(|\)|'$/g, '').replace(/^'|"|\`|\(|\)|'$/g, ''))
        .map(v => v.replace(/^'|"|\`/, '').replace(/'|"|\`$/, ''));
    }
    console.log('Valores del ENUM rol:', values);
    const hasCeo = values.includes('ceo');
    console.log('¿Incluye "ceo"?:', hasCeo ? 'Sí' : 'No');
    process.exit(0);
  } catch (err) {
    console.error('Error al consultar ENUM de rol:', err);
    process.exit(1);
  }
})();

