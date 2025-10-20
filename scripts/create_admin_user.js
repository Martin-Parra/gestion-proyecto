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

    // Datos del usuario administrador
    const usuario = {
        nombre: 'Admin',
        email: 'admin',  // Usando 'admin' como email para facilitar el login
        password: '$2b$10$ou9z/mOszibhc2VNxEd.7eC5ShH7VExCKt5c7gIc.QDTXFt8PQb4q', // Hash de 'admin123'
        rol: 'administrador',
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
            console.log('El usuario administrador ya existe, actualizando contraseña...');
            
            // Actualizar la contraseña del usuario existente
            connection.query('UPDATE usuarios SET password = ?, rol = ? WHERE email = ?', 
                [usuario.password, usuario.rol, usuario.email], 
                (err, results) => {
                    if (err) {
                        console.error('Error al actualizar usuario administrador:', err);
                    } else {
                        console.log('Usuario administrador actualizado exitosamente');
                        console.log('Credenciales: email=admin, contraseña=admin123');
                    }
                    
                    showUsers();
                }
            );
        } else {
            // Insertar el usuario administrador
            connection.query('INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)', 
                [usuario.nombre, usuario.email, usuario.password, usuario.rol, usuario.activo], 
                (err, results) => {
                    if (err) {
                        console.error('Error al crear usuario administrador:', err);
                    } else {
                        console.log('Usuario administrador creado exitosamente');
                        console.log('Credenciales: email=admin, contraseña=admin123');
                    }
                    
                    showUsers();
                }
            );
        }
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