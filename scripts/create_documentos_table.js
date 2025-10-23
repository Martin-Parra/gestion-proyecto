const pool = require('../src/db/connection');

async function createDocumentosTable(){
  const sql = `
    CREATE TABLE IF NOT EXISTS documentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proyecto_id INT NOT NULL,
      usuario_id INT NULL,
      nombre_archivo VARCHAR(255) NOT NULL,
      ruta VARCHAR(500) NOT NULL,
      tipo VARCHAR(100) NULL,
      tamano BIGINT NULL,
      fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fecha_vencimiento DATE NULL,
      CONSTRAINT fk_documentos_proyecto FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      CONSTRAINT fk_documentos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    );
  `;

  try{
    await pool.promise().query(sql);
    console.log('Tabla documentos verificada/creada correctamente');
  }catch(err){
    console.error('Error creando tabla documentos:', err);
    process.exitCode = 1;
  } finally {
    if (pool && pool.end) pool.end();
  }
}

createDocumentosTable();