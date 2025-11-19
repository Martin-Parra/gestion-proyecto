const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'gestion_proyectos'
});

const ADMIN_EMAIL = 'admin';
const ADMIN_NAME = 'Admin';
// Hash de 'admin123' (bcrypt 10 rounds) tomado del script existente
const ADMIN_HASH = '$2b$10$ou9z/mOszibhc2VNxEd.7eC5ShH7VExCKt5c7gIc.QDTXFt8PQb4q';

connection.connect(async (err) => {
  if (err) { console.error('Error de conexión:', err); return; }
  console.log('Conectado a BD:', process.env.DB_NAME || 'gestion_proyectos');
  try {
    const [rows] = await connection.promise().query('SELECT id FROM usuarios WHERE email = ?', [ADMIN_EMAIL]);
    if (rows.length) {
      await connection.promise().query('UPDATE usuarios SET password = ?, rol = ?, activo = 1 WHERE email = ?', [ADMIN_HASH, 'administrador', ADMIN_EMAIL]);
      console.log('Admin existente actualizado. email=admin, password=admin123');
    } else {
      await connection.promise().query('INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, 1)', [ADMIN_NAME, ADMIN_EMAIL, ADMIN_HASH, 'administrador']);
      console.log('Admin creado. email=admin, password=admin123');
    }
    const [list] = await connection.promise().query('SELECT id, nombre, email, rol, activo FROM usuarios');
    console.table(list);
  } catch (e) {
    console.error('Error creando/actualizando admin:', e);
  } finally {
    connection.end();
  }
});