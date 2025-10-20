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

    // Consultar usuarios con rol jefe_proyecto
    connection.query("SELECT * FROM usuarios WHERE rol = 'jefe_proyecto'", (err, results) => {
        if (err) {
            console.error('Error al consultar usuarios:', err);
            connection.end();
            return;
        }
        
        console.log('Usuarios con rol jefe_proyecto:');
        console.table(results);
        
        // Cerrar la conexión
        connection.end();
        console.log('Conexión a la base de datos cerrada');
    });
});