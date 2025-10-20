const mysql = require('mysql2');
const bcrypt = require('bcrypt');

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

    // Datos del nuevo usuario
    const nuevoUsuario = {
        nombre: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@empresa.com',
        password: 'jefe123',
        rol: 'jefe_proyecto',
        activo: 1
    };

    // Encriptar la contraseña
    bcrypt.hash(nuevoUsuario.password, 10, (err, hash) => {
        if (err) {
            console.error('Error al encriptar la contraseña:', err);
            connection.end();
            return;
        }

        // Insertar el nuevo usuario con la contraseña encriptada
        const insertQuery = `
            INSERT INTO usuarios (nombre, email, password, rol, activo)
            VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(
            insertQuery,
            [nuevoUsuario.nombre, nuevoUsuario.email, hash, nuevoUsuario.rol, nuevoUsuario.activo],
            (err, results) => {
                if (err) {
                    console.error('Error al insertar el usuario:', err);
                    connection.end();
                    return;
                }
                console.log('Usuario jefe de proyecto creado correctamente');
                console.log('ID del nuevo usuario:', results.insertId);

                // Verificar que el usuario se haya creado correctamente
                connection.query(
                    'SELECT * FROM usuarios WHERE id = ?',
                    [results.insertId],
                    (err, results) => {
                        if (err) {
                            console.error('Error al verificar el usuario:', err);
                            connection.end();
                            return;
                        }
                        console.log('Datos del nuevo usuario:');
                        console.table(results);

                        // Verificar todos los jefes de proyecto
                        connection.query(
                            "SELECT * FROM usuarios WHERE rol = 'jefe_proyecto'",
                            (err, results) => {
                                if (err) {
                                    console.error('Error al consultar jefes de proyecto:', err);
                                    connection.end();
                                    return;
                                }
                                console.log('Todos los jefes de proyecto:');
                                console.table(results);

                                // Cerrar la conexión
                                connection.end();
                                console.log('Conexión a la base de datos cerrada');
                            }
                        );
                    }
                );
            }
        );
    });
});