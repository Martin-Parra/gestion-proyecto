const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'gestion_proyectos'
});

connection.connect(async (err) => {
  if (err) { console.error('Error de conexión:', err); return; }
  console.log('BD:', process.env.DB_NAME || 'gestion_proyectos');
  try {
    const [rows] = await connection.promise().query(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE email = ?', ['admin']
    );
    if (!rows.length) {
      console.log('No existe usuario admin en esta base de datos.');
    } else {
      console.log('Usuario admin encontrado:');
      console.table(rows);
    }
  } catch (e) {
    console.error('Error consultando usuarios:', e);
  } finally {
    connection.end();
  }
});