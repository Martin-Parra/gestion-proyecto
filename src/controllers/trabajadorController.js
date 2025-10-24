const pool = require('../db/connection');

// Obtener proyecto asignado al trabajador
exports.obtenerProyectoAsignado = (req, res) => {
    const userId = req.session.user.id;
    
    const query = `
        SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.fecha_inicio,
            p.fecha_fin,
            p.estado,
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
        GROUP BY p.id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_fin, p.estado, p.created_at, u.nombre
        LIMIT 1
    `;
    
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener proyecto asignado:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
        
        if (results.length === 0) {
            return res.json({
                success: true,
                proyecto: null,
                message: 'No tienes proyecto asignado'
            });
        }
        
        res.json({
            success: true,
            proyecto: results[0]
        });
    });
};

// Obtener todos los proyectos asignados al trabajador
exports.obtenerProyectosAsignados = (req, res) => {
    const userId = req.session.user.id;

    const query = `
        SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.fecha_inicio,
            p.fecha_fin,
            p.estado,
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
        GROUP BY p.id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_fin, p.estado, p.created_at, u.nombre
        ORDER BY p.created_at DESC
    `;

    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener proyectos asignados:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }

        return res.json({
            success: true,
            proyectos: results
        });
    });
};

// Obtener tareas asignadas al trabajador
exports.obtenerTareasAsignadas = (req, res) => {
    const userId = req.session.user.id;
    
    const query = `
        SELECT 
            t.id,
            t.titulo as nombre,
            t.descripcion,
            t.estado,
            t.created_at,
            p.nombre as proyecto_nombre
        FROM tareas t
        INNER JOIN proyectos p ON t.proyecto_id = p.id
        INNER JOIN asignaciones a ON p.id = a.proyecto_id
        WHERE a.usuario_id = ?
        ORDER BY t.created_at DESC
    `;
    
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener tareas asignadas:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
        
        res.json({
            success: true,
            tareas: results
        });
    });
};

// Actualizar estado de una tarea (solo si el trabajador está asignado al proyecto)
exports.actualizarEstadoTarea = (req, res) => {
    const { id: tareaId } = req.params;
    const { estado } = req.body;
    const userId = req.session.user.id;
    
    // Validar estado
    const estadosValidos = ['pendiente', 'en_progreso', 'completada'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            success: false,
            message: 'Estado no válido'
        });
    }
    
    // Verificar que el trabajador esté asignado al proyecto de la tarea
    const verificarQuery = `
        SELECT t.id 
        FROM tareas t
        INNER JOIN proyectos p ON t.proyecto_id = p.id
        INNER JOIN asignaciones a ON p.id = a.proyecto_id
        WHERE t.id = ? AND a.usuario_id = ?
    `;
    
    pool.query(verificarQuery, [tareaId, userId], (err, results) => {
        if (err) {
            console.error('Error al verificar asignación:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
        
        if (results.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para actualizar esta tarea'
            });
        }
        
        // Actualizar estado de la tarea
        const updateQuery = 'UPDATE tareas SET estado = ? WHERE id = ?';
        
        pool.query(updateQuery, [estado, tareaId], (err, result) => {
            if (err) {
                console.error('Error al actualizar estado de tarea:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar el estado de la tarea'
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarea no encontrada'
                });
            }
            
            res.json({
                success: true,
                message: 'Estado de la tarea actualizado correctamente'
            });
        });
    });
};

// Obtener detalles completos del proyecto asignado
exports.obtenerDetalleProyecto = (req, res) => {
    const userId = req.session.user.id;
    const proyectoId = req.params.id;
    
    // Verificar que el trabajador esté asignado al proyecto
    const verificarQuery = `
        SELECT 1 FROM asignaciones 
        WHERE usuario_id = ? AND proyecto_id = ?
    `;
    
    pool.query(verificarQuery, [userId, proyectoId], (err, results) => {
        if (err) {
            console.error('Error al verificar asignación:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
        
        if (results.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No tienes acceso a este proyecto'
            });
        }
        
        // Obtener detalles del proyecto
        const proyectoQuery = `
            SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.fecha_inicio,
                p.fecha_fin,
                p.estado,
                p.created_at,
                u.nombre as jefe_nombre,
                u.email as jefe_email,
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
            LEFT JOIN tareas t ON p.id = t.proyecto_id
            WHERE p.id = ?
            GROUP BY p.id, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_fin, p.estado, p.created_at, u.nombre, u.email
        `;
        
        pool.query(proyectoQuery, [proyectoId], (err, proyectoResults) => {
            if (err) {
                console.error('Error al obtener proyecto:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener detalles del proyecto'
                });
            }
            
            if (proyectoResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Proyecto no encontrado'
                });
            }
            
            // Obtener tareas del proyecto (compatibles con esquema actual)
            const tareasQuery = `
                SELECT 
                    t.id,
                    t.titulo,
                    t.descripcion,
                    t.estado,
                    t.created_at
                FROM tareas t
                WHERE t.proyecto_id = ?
                ORDER BY t.created_at DESC
            `;
            
            pool.query(tareasQuery, [proyectoId], (err, tareasResults) => {
                if (err) {
                    console.error('Error al obtener tareas:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error al obtener tareas del proyecto'
                    });
                }
                
                // Obtener miembros del equipo
                const equipoQuery = `
                    SELECT 
                        u.id,
                        u.nombre,
                        u.email,
                        u.rol
                    FROM usuarios u
                    INNER JOIN asignaciones a ON u.id = a.usuario_id
                    WHERE a.proyecto_id = ?
                    ORDER BY u.nombre
                `;
                
                pool.query(equipoQuery, [proyectoId], (err, equipoResults) => {
                    if (err) {
                        console.error('Error al obtener equipo:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error al obtener equipo del proyecto'
                        });
                    }
                    
                    res.json({
                        success: true,
                        proyecto: proyectoResults[0],
                        tareas: tareasResults,
                        equipo: equipoResults
                    });
                });
            });
        });
    });
};