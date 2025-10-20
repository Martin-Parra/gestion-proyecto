const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Martin125',
  database: 'gestion_proyectos'
});

connection.connect();

const alterEnum = `
ALTER TABLE tareas 
MODIFY COLUMN estado ENUM('pendiente','en_progreso','revisando','completada') DEFAULT 'pendiente';
`;

connection.query(alterEnum, (err) => {
  if (err) {
    console.error('Error al actualizar ENUM de estado en tareas:', err);
  } else {
    console.log('ENUM de estado actualizado a incluir "revisando"');
  }
  connection.end();
});