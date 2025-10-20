const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Martin125',
    database: 'gestion_proyectos'
});

connection.connect();

// Consulta para verificar usuarios con rol jefe_proyecto
connection.query(
    "SELECT id, nombre, email, rol, activo FROM usuarios WHERE rol = 'jefe_proyecto'",
    (err, results) => {
        if (err) {
            console.error('Error al consultar jefes de proyecto:', err);
        } else {
            console.log('Jefes de proyecto encontrados:');
            console.table(results);
        }
        
        // Verificar si hay usuarios activos con rol jefe_proyecto
        connection.query(
            "SELECT id, nombre, email, rol, activo FROM usuarios WHERE rol = 'jefe_proyecto' AND activo = 1",
            (err, results) => {
                if (err) {
                    console.error('Error al consultar jefes de proyecto activos:', err);
                } else {
                    console.log('Jefes de proyecto activos:');
                    console.table(results);
                }
                connection.end();
            }
        );
    }
);