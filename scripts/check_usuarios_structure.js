const mysql = require('mysql2');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Martin125',
    database: 'gestion_proyectos'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');

    // Verificar estructura de la tabla usuarios
    connection.query('DESCRIBE usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener estructura de usuarios:', err);
            connection.end();
            return;
        }

        console.log('\n=== ESTRUCTURA DE LA TABLA USUARIOS ===');
        results.forEach(column => {
            console.log(`${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
        });

        // Verificar datos del usuario trabajador
        connection.query('SELECT * FROM usuarios WHERE email = ?', ['trabajador@example.com'], (err, userResults) => {
            if (err) {
                console.error('Error al buscar usuario trabajador:', err);
            } else {
                console.log('\n=== USUARIO TRABAJADOR ===');
                if (userResults.length > 0) {
                    console.log('Usuario encontrado:', userResults[0]);
                } else {
                    console.log('Usuario trabajador no encontrado');
                }
            }

            // Verificar asignaciones
            connection.query(`
                SELECT 
                    u.id as usuario_id,
                    u.nombre as usuario_nombre,
                    u.email as usuario_email,
                    p.id as proyecto_id,
                    p.nombre as proyecto_nombre
                FROM usuarios u
                LEFT JOIN asignaciones a ON u.id = a.usuario_id
                LEFT JOIN proyectos p ON a.proyecto_id = p.id
                WHERE u.email = ?
            `, ['trabajador@example.com'], (err, assignResults) => {
                if (err) {
                    console.error('Error al verificar asignaciones:', err);
                } else {
                    console.log('\n=== ASIGNACIONES DEL TRABAJADOR ===');
                    if (assignResults.length > 0) {
                        assignResults.forEach(assign => {
                            console.log(`Usuario: ${assign.usuario_nombre || assign.usuario_email} -> Proyecto: ${assign.proyecto_nombre || 'Sin proyecto'}`);
                        });
                    } else {
                        console.log('No se encontraron asignaciones');
                    }
                }
                connection.end();
            });
        });
    });
});