const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Martin125',
    database: 'gestion_proyectos'
});

connection.connect();

// Crear tabla de proyectos
const createProyectosTable = `
CREATE TABLE IF NOT EXISTS proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    responsable_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
)`;

connection.query(createProyectosTable, (err, results) => {
    if (err) {
        console.error('Error al crear tabla proyectos:', err);
    } else {
        console.log('Tabla proyectos creada correctamente');
        
        // Crear tabla de asignaciones
        const createAsignacionesTable = `
        CREATE TABLE IF NOT EXISTS asignaciones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            proyecto_id INT NOT NULL,
            usuario_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            UNIQUE KEY unique_asignacion (proyecto_id, usuario_id)
        )`;
        
        connection.query(createAsignacionesTable, (err, results) => {
            if (err) {
                console.error('Error al crear tabla asignaciones:', err);
            } else {
                console.log('Tabla asignaciones creada correctamente');
            }
            connection.end();
        });
    }
});