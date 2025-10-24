const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'gestion_proyectos'
});

// Nombre del trabajador a asignar (ajusta si es necesario)
const WORKER_NAME_HINT = 'andriu'; // buscará por nombre que contenga este texto

connection.connect(async (err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL usando .env');

  try {
    // Buscar trabajador por nombre aproximado
    const [users] = await connection.promise().query(
      "SELECT id, nombre, email, rol FROM usuarios WHERE rol IN ('trabajador','miembro') AND nombre LIKE ? ORDER BY id DESC",
      [`%${WORKER_NAME_HINT}%`]
    );

    if (users.length === 0) {
      console.log(`No se encontró trabajador por nombre parecido a: ${WORKER_NAME_HINT}`);
      const [allWorkers] = await connection.promise().query(
        "SELECT id, nombre, email, rol FROM usuarios WHERE rol IN ('trabajador','miembro') ORDER BY nombre"
      );
      console.log('Trabajadores disponibles:');
      console.table(allWorkers);
      return connection.end();
    }

    const worker = users[0];
    console.log('Trabajador seleccionado:', worker);

    // Elegir proyecto más reciente
    const [projects] = await connection.promise().query(
      'SELECT id, nombre FROM proyectos ORDER BY created_at DESC, id DESC LIMIT 1'
    );
    if (projects.length === 0) {
      console.log('No hay proyectos disponibles para asignar. Crea un proyecto primero.');
      return connection.end();
    }
    const project = projects[0];
    console.log('Proyecto objetivo:', project);

    // Verificar si ya está asignado
    const [existing] = await connection.promise().query(
      'SELECT id FROM asignaciones WHERE proyecto_id = ? AND usuario_id = ?',
      [project.id, worker.id]
    );

    if (existing.length > 0) {
      console.log('El trabajador ya está asignado a este proyecto.');
    } else {
      await connection.promise().query(
        'INSERT INTO asignaciones (proyecto_id, usuario_id) VALUES (?, ?)',
        [project.id, worker.id]
      );
      console.log('Asignación creada correctamente.');
    }

    // Mostrar confirmación
    const [check] = await connection.promise().query(
      `SELECT u.nombre as trabajador, p.nombre as proyecto
       FROM asignaciones a
       INNER JOIN usuarios u ON a.usuario_id = u.id
       INNER JOIN proyectos p ON a.proyecto_id = p.id
       WHERE a.usuario_id = ? AND a.proyecto_id = ?`,
      [worker.id, project.id]
    );
    console.table(check);
  } catch (e) {
    console.error('Error en el script de asignación:', e);
  } finally {
    connection.end();
  }
});