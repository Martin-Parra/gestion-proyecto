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
    "SELECT * FROM usuarios WHERE rol = 'jefe_proyecto'",
    (err, results) => {
        if (err) {
            console.error('Error al consultar jefes de proyecto:', err);
        } else {
            console.log('Jefes de proyecto encontrados:');
            console.table(results);
        }
        connection.end();
    }
);