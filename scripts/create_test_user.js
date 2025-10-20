const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

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

    // Datos del usuario de prueba
    const usuario = {
        nombre: 'Usuario de Prueba',
        email: 'prueba@example.com',
        password: '$2b$10$v8.pIKFOa0boZgyhKoja8OeBa6YV2CAhFFH7KjE04Cgsy.rljbP.q', // Hash de 'prueba123'
        rol: 'miembro',
        activo: 1
    };

    // Verificar si el usuario ya existe
    connection.query('SELECT * FROM usuarios WHERE email = ?', [usuario.email], (err, results) => {
        if (err) {
            console.error('Error al verificar usuario:', err);
            connection.end();
            return;
        }

        if (results.length > 0) {
            console.log('El usuario de prueba ya existe');
            showUsers();
            return;
        }

        // Insertar el usuario de prueba
        connection.query('INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)', 
            [usuario.nombre, usuario.email, usuario.password, usuario.rol, usuario.activo], 
            (err, results) => {
                if (err) {
                    console.error('Error al crear usuario de prueba:', err);
                } else {
                    console.log('Usuario de prueba creado exitosamente');
                    console.log('Credenciales: email=prueba@example.com, contraseña=prueba123');
                }
                
                showUsers();
            }
        );
    });

    function showUsers() {
        // Mostrar todos los usuarios para verificar
        connection.query('SELECT id, nombre, email, rol, activo FROM usuarios', (err, results) => {
            if (err) {
                console.error('Error al consultar usuarios:', err);
            } else {
                console.log('Lista de usuarios en la base de datos:');
                console.table(results);
            }
            
            // Cerrar la conexión
            connection.end();
        });
    }
});