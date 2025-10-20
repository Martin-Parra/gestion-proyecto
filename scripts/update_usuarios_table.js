const mysql = require('mysql2');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Martin125',
    database: 'gestion_proyectos'
});

// Conectar a la base de datos
connection.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión a la base de datos establecida');

    // Modificar la estructura de la tabla usuarios para incluir el rol jefe_proyecto
    const alterTableQuery = `
        ALTER TABLE usuarios 
        MODIFY COLUMN rol ENUM('admin', 'trabajador', 'jefe_proyecto', 'administrador', 'miembro') NOT NULL;
    `;

    connection.query(alterTableQuery, (err, results) => {
        if (err) {
            console.error('Error al modificar la tabla usuarios:', err);
            connection.end();
            return;
        }
        console.log('Tabla usuarios modificada correctamente');
        console.log('Resultado:', results);

        // Verificar la estructura actualizada de la tabla
        connection.query('DESCRIBE usuarios', (err, results) => {
            if (err) {
                console.error('Error al verificar la estructura de la tabla:', err);
                connection.end();
                return;
            }
            console.log('Estructura actual de la tabla usuarios:');
            console.table(results);

            // Cerrar la conexión
            connection.end();
            console.log('Conexión a la base de datos cerrada');
        });
    });
});