const pool = require('../src/db/connection');

async function run(){
  const conn = pool.promise();
  try{
    await conn.query(`
      CREATE TABLE IF NOT EXISTS correos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        remitente_id INT NOT NULL,
        asunto VARCHAR(255) NOT NULL,
        cuerpo MEDIUMTEXT NULL,
        es_borrador TINYINT(1) DEFAULT 0,
        fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (remitente_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS correo_destinatarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correo_id INT NOT NULL,
        usuario_id INT NOT NULL,
        tipo ENUM('to','cc','bcc') NOT NULL DEFAULT 'to',
        leido TINYINT(1) DEFAULT 0,
        fecha_leido TIMESTAMP NULL,
        eliminado TINYINT(1) DEFAULT 0,
        FOREIGN KEY (correo_id) REFERENCES correos(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario (usuario_id, leido, eliminado),
        INDEX idx_correo (correo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS correo_adjuntos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correo_id INT NOT NULL,
        nombre_original VARCHAR(255) NOT NULL,
        archivo VARCHAR(300) NOT NULL, -- ruta relativa bajo uploads/
        mime VARCHAR(150) NULL,
        tamano BIGINT NULL,
        fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (correo_id) REFERENCES correos(id) ON DELETE CASCADE,
        INDEX idx_correo_adj (correo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Tablas de correo creadas o ya existentes.');
    process.exit(0);
  } catch (err){
    console.error('Error creando tablas de correo:', err);
    process.exit(1);
  }
}

run();