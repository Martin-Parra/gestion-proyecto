const pool = require('../src/db/connection');

async function ensureProyectoEstadoEnum(){
  const conn = pool.promise();
  const ensureEnum = `
    ALTER TABLE proyectos 
    MODIFY COLUMN estado ENUM('en_ejecucion','en_pausa','finalizado') NOT NULL DEFAULT 'en_ejecucion';
  `;
  const addColumn = `
    ALTER TABLE proyectos 
    ADD COLUMN estado ENUM('en_ejecucion','en_pausa','finalizado') NOT NULL DEFAULT 'en_ejecucion';
  `;
  const checkColumn = `
    SELECT COUNT(*) AS cnt
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proyectos' AND COLUMN_NAME = 'estado';
  `;

  try{
    const [rows] = await conn.query(checkColumn);
    const exists = rows && rows[0] && rows[0].cnt > 0;
    if (!exists){
      await conn.query(addColumn);
      console.log('Columna estado agregada');
    }
    await conn.query(ensureEnum);
    console.log('Columna estado confirmada con ENUM esperado');
  }catch(err){
    console.error('Error ajustando columna estado:', err);
    process.exitCode = 1;
  }finally{
    if (pool && pool.end) pool.end();
  }
}

ensureProyectoEstadoEnum();