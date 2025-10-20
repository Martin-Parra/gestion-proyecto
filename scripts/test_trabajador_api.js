const mysql = require('mysql2');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Martin125',
    database: 'gestion_proyectos'
};

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');

    // Simular la consulta que hace el controlador del trabajador
    const userId = 34; // ID del usuario trabajador que encontramos antes
    
    const query = `
        SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.fecha_inicio,
            p.fecha_fin,
            p.created_at,
            u.nombre as jefe_nombre,
            COALESCE(
                ROUND(
                    (COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) * 100.0) / 
                    NULLIF(COUNT(t.id), 0), 
                    2
                ), 
                0
            ) as porcentaje_avance
        FROM proyectos p
        LEFT JOIN usuarios u ON p.responsable_id = u.id
        INNER JOIN asignaciones a ON p.id = a.proyecto_id
        LEFT JOIN tareas t ON p.id = t.proyecto_id
        WHERE a.usuario_id = ?
        GROUP BY p.id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_fin, p.created_at, u.nombre
        LIMIT 1
    `;
    
    console.log('\n=== PROBANDO CONSULTA DEL TRABAJADOR ===');
    console.log('Usuario ID:', userId);
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
        } else {
            console.log('\n=== RESULTADO DE LA CONSULTA ===');
            if (results.length > 0) {
                console.log('Proyecto encontrado:', results[0]);
            } else {
                console.log('No se encontró ningún proyecto asignado');
            }
        }
        
        // Verificar también las tareas del usuario
        const tareasQuery = `
            SELECT 
                t.id,
                t.titulo,
                t.descripcion,
                t.estado,
                t.proyecto_id,
                p.nombre as proyecto_nombre
            FROM tareas t
            INNER JOIN proyectos p ON t.proyecto_id = p.id
            INNER JOIN asignaciones a ON p.id = a.proyecto_id
            WHERE a.usuario_id = ?
        `;
        
        connection.query(tareasQuery, [userId], (err, tareasResults) => {
            if (err) {
                console.error('Error al consultar tareas:', err);
            } else {
                console.log('\n=== TAREAS DEL TRABAJADOR ===');
                if (tareasResults.length > 0) {
                    console.log(`Encontradas ${tareasResults.length} tareas:`);
                    tareasResults.forEach(tarea => {
                        console.log(`- ${tarea.titulo} (${tarea.estado}) - Proyecto: ${tarea.proyecto_nombre}`);
                    });
                } else {
                    console.log('No se encontraron tareas asignadas');
                }
            }
            
            connection.end();
        });
    });
});