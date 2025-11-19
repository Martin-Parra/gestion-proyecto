const mysql = require('mysql2');
require('dotenv').config();

// Usa variables de entorno si están configuradas; de lo contrario, aplica valores por defecto
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'gestion_proyectos'
});

connection.connect(async (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a MySQL');

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS perfiles_usuario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL UNIQUE,
      avatar_url VARCHAR(255) NULL,
      telefono VARCHAR(30) NULL,
      direccion VARCHAR(255) NULL,
      bio TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  try {
    await connection.promise().query(createTableSql);
    console.log('Tabla perfiles_usuario creada/verificada correctamente.');

    // Crear perfiles vacíos para usuarios existentes si no tienen uno
    const seedSql = `
      INSERT INTO perfiles_usuario (usuario_id)
      SELECT u.id FROM usuarios u
      LEFT JOIN perfiles_usuario p ON p.usuario_id = u.id
      WHERE p.usuario_id IS NULL;
    `;
    const [result] = await connection.promise().query(seedSql);
    console.log(`Perfiles iniciales insertados: ${result.affectedRows}`);

    // Mostrar un resumen de la tabla recién creada
    const [rows] = await connection.promise().query(
      'SELECT p.id, p.usuario_id, u.nombre, u.email, p.avatar_url, p.telefono FROM perfiles_usuario p JOIN usuarios u ON u.id = p.usuario_id ORDER BY p.id DESC LIMIT 10'
    );
    console.log('Muestra de perfiles creados/actuales (máx 10):');
    console.table(rows);
  } catch (e) {
    console.error('Error creando/sembrando perfiles_usuario:', e);
  } finally {
    connection.end();
  }
});