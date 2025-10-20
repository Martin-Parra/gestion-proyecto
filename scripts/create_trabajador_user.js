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

    // Datos del usuario trabajador
    const usuario = {
        nombre: 'Trabajador de Prueba',
        email: 'trabajador@example.com',
        password: '$2b$10$v8.pIKFOa0boZgyhKoja8OeBa6YV2CAhFFH7KjE04Cgsy.rljbP.q', // Hash de 'prueba123'
        rol: 'trabajador',
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
            console.log('El usuario trabajador ya existe');
            console.log('Datos del usuario:', results[0]);
            connection.end();
            return;
        }

        // Insertar el usuario trabajador
        connection.query('INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)', 
            [usuario.nombre, usuario.email, usuario.password, usuario.rol, usuario.activo], 
            (err, results) => {
                if (err) {
                    console.error('Error al crear usuario trabajador:', err);
                } else {
                    console.log('Usuario trabajador creado exitosamente');
                    console.log('Email: trabajador@example.com');
                    console.log('Password: prueba123');
                    console.log('Rol: trabajador');
                }
                connection.end();
            }
        );
    });
});