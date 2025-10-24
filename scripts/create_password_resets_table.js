const pool = require('../src/db/connection');

async function createPasswordResetsTable(){
  const sql = `
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

  try{
    await pool.promise().query(sql);
    console.log('Tabla password_resets verificada/creada.');
  }catch(err){
    console.error('Error creando tabla password_resets:', err);
    process.exitCode = 1;
  } finally {
    if (pool && pool.end) pool.end();
  }
}

createPasswordResetsTable();