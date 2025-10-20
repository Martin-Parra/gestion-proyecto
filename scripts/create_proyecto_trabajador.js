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

    // Primero obtener el ID del trabajador
    connection.query('SELECT id FROM usuarios WHERE email = ?', ['trabajador@example.com'], (err, trabajadorResults) => {
        if (err) {
            console.error('Error al buscar trabajador:', err);
            connection.end();
            return;
        }

        if (trabajadorResults.length === 0) {
            console.log('No se encontró el usuario trabajador. Ejecuta primero create_trabajador_user.js');
            connection.end();
            return;
        }

        const trabajadorId = trabajadorResults[0].id;

        // Obtener un administrador para asignar como responsable
        connection.query('SELECT id FROM usuarios WHERE rol = ? LIMIT 1', ['administrador'], (err, adminResults) => {
            if (err) {
                console.error('Error al buscar administrador:', err);
                connection.end();
                return;
            }

            let responsableId = null;
            if (adminResults.length > 0) {
                responsableId = adminResults[0].id;
            }

            // Datos del proyecto
            const proyecto = {
                nombre: 'Proyecto de Prueba para Trabajador',
                descripcion: 'Este es un proyecto de prueba asignado al trabajador para probar la funcionalidad del dashboard.',
                fecha_inicio: '2024-01-01',
                fecha_fin: '2024-12-31',
                responsable_id: responsableId
            };

            // Verificar si el proyecto ya existe
            connection.query('SELECT * FROM proyectos WHERE nombre = ?', [proyecto.nombre], (err, results) => {
                if (err) {
                    console.error('Error al verificar proyecto:', err);
                    connection.end();
                    return;
                }

                if (results.length > 0) {
                    console.log('El proyecto ya existe');
                    const proyectoId = results[0].id;
                    
                    // Verificar si ya está asignado
                    connection.query('SELECT * FROM asignaciones WHERE proyecto_id = ? AND usuario_id = ?', 
                        [proyectoId, trabajadorId], (err, asignacionResults) => {
                        if (err) {
                            console.error('Error al verificar asignación:', err);
                            connection.end();
                            return;
                        }

                        if (asignacionResults.length > 0) {
                            console.log('El proyecto ya está asignado al trabajador');
                        } else {
                            // Asignar el proyecto al trabajador
                            connection.query('INSERT INTO asignaciones (proyecto_id, usuario_id) VALUES (?, ?)', 
                                [proyectoId, trabajadorId], (err, result) => {
                                if (err) {
                                    console.error('Error al asignar proyecto:', err);
                                } else {
                                    console.log('Proyecto asignado al trabajador exitosamente');
                                }
                                connection.end();
                            });
                        }
                    });
                    return;
                }

                // Crear el proyecto
                connection.query('INSERT INTO proyectos (nombre, descripcion, fecha_inicio, fecha_fin, responsable_id) VALUES (?, ?, ?, ?, ?)', 
                    [proyecto.nombre, proyecto.descripcion, proyecto.fecha_inicio, proyecto.fecha_fin, proyecto.responsable_id], 
                    (err, results) => {
                        if (err) {
                            console.error('Error al crear proyecto:', err);
                            connection.end();
                            return;
                        }

                        const proyectoId = results.insertId;
                        console.log('Proyecto creado exitosamente con ID:', proyectoId);

                        // Asignar el proyecto al trabajador
                        connection.query('INSERT INTO asignaciones (proyecto_id, usuario_id) VALUES (?, ?)', 
                            [proyectoId, trabajadorId], (err, result) => {
                            if (err) {
                                console.error('Error al asignar proyecto:', err);
                            } else {
                                console.log('Proyecto asignado al trabajador exitosamente');
                                
                                // Crear algunas tareas de ejemplo
                                const tareas = [
                                    {
                                        titulo: 'Configurar entorno de desarrollo',
                                        descripcion: 'Instalar y configurar todas las herramientas necesarias',
                                        estado: 'completada'
                                    },
                                    {
                                        titulo: 'Diseñar base de datos',
                                        descripcion: 'Crear el esquema de la base de datos del proyecto',
                                        estado: 'en_progreso'
                                    },
                                    {
                                        titulo: 'Implementar API REST',
                                        descripcion: 'Desarrollar los endpoints de la API',
                                        estado: 'pendiente'
                                    },
                                    {
                                        titulo: 'Crear interfaz de usuario',
                                        descripcion: 'Desarrollar la interfaz web del proyecto',
                                        estado: 'pendiente'
                                    },
                                    {
                                        titulo: 'Realizar pruebas',
                                        descripcion: 'Ejecutar pruebas unitarias e integración',
                                        estado: 'pendiente'
                                    }
                                ];

                                let tareasCreadas = 0;
                                tareas.forEach((tarea, index) => {
                                    connection.query('INSERT INTO tareas (titulo, descripcion, estado, proyecto_id) VALUES (?, ?, ?, ?)', 
                                        [tarea.titulo, tarea.descripcion, tarea.estado, proyectoId], 
                                        (err, result) => {
                                            if (err) {
                                                console.error('Error al crear tarea:', err);
                                            } else {
                                                tareasCreadas++;
                                                console.log(`Tarea creada: ${tarea.titulo}`);
                                            }
                                            
                                            if (tareasCreadas === tareas.length || index === tareas.length - 1) {
                                                console.log(`\nProyecto configurado completamente:`);
                                                console.log(`- Proyecto: ${proyecto.nombre}`);
                                                console.log(`- Asignado a: trabajador@example.com`);
                                                console.log(`- Tareas creadas: ${tareasCreadas}`);
                                                console.log(`- Progreso: 20% (1 de 5 tareas completadas)`);
                                                connection.end();
                                            }
                                        }
                                    );
                                });
                            }
                        });
                    }
                );
            });
        });
    });
});