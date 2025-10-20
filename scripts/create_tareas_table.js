const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function createTareasTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Martin125',
        database: 'gestion_proyectos'
    });

    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '..', 'src', 'models', 'tareas.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el script SQL
        await connection.query(sql);
        console.log('Tabla de tareas creada exitosamente');

    } catch (error) {
        console.error('Error al crear la tabla de tareas:', error);
    } finally {
        // Cerrar la conexión
        await connection.end();
    }
}

// Ejecutar la función
createTareasTable();