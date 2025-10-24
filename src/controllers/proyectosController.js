const pool = require('../db/connection');

// Obtener todos los proyectos
exports.obtenerProyectos = async (req, res) => {
    try {
        const [rows] = await pool.promise().query(
            `SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.fecha_inicio,
                p.fecha_fin,
                p.responsable_id,
                p.created_at,
                p.estado,
                u.nombre AS jefe_nombre,
                (SELECT COUNT(*) FROM tareas t WHERE t.proyecto_id = p.id) AS total_tareas,
                (SELECT COUNT(*) FROM tareas t WHERE t.proyecto_id = p.id AND t.estado = 'completada') AS tareas_completadas
             FROM proyectos p 
             LEFT JOIN usuarios u ON p.responsable_id = u.id 
             ORDER BY p.created_at DESC`
        );

        const proyectos = rows.map(p => {
            const total = p.total_tareas || 0;
            const completadas = p.tareas_completadas || 0;
            const porcentaje_avance = total > 0 ? Math.round((completadas / total) * 100) : 0;
            const { total_tareas, tareas_completadas, ...rest } = p;
            return { ...rest, porcentaje_avance };
        });

        res.json({
            success: true,
            proyectos
        });
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los proyectos'
        });
    }
};

// Obtener todos los jefes de proyecto
exports.obtenerJefesProyecto = async (req, res) => {
    try {
        const [jefes] = await pool.promise().query(
            "SELECT id, nombre, email FROM usuarios WHERE rol = 'jefe_proyecto' AND activo = 1"
        );

        res.json({
            success: true,
            jefes: jefes
        });
    } catch (error) {
        console.error('Error al obtener jefes de proyecto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener jefes de proyecto'
        });
    }
};

// Crear un nuevo proyecto
exports.crearProyecto = async (req, res) => {
    const { nombre_proyecto, descripcion_proyecto, fecha_inicio, fecha_fin, responsable_id } = req.body;
    
    // Validaciones
    if (!nombre_proyecto || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
            success: false,
            error: 'Nombre del proyecto, fecha de inicio y fecha de finalización son obligatorios'
        });
    }
    
    // Si no se proporciona responsable_id, establecer como null
    const responsable = responsable_id || null;
    
    // Verificar que la fecha de fin sea posterior a la fecha de inicio
    try {
        if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
            return res.status(400).json({
                success: false,
                error: 'La fecha de finalización debe ser posterior a la fecha de inicio'
            });
        }
    } catch (error) {
        console.error('Error al validar fechas:', error);
        return res.status(400).json({
            success: false,
            error: 'Formato de fecha inválido'
        });
    }
    
    try {
        // Si se proporciona un responsable_id, verificar que exista y sea jefe de proyecto
        if (responsable) {
            const [responsables] = await pool.promise().query(
                "SELECT id FROM usuarios WHERE id = ? AND rol = 'jefe_proyecto' AND activo = 1",
                [responsable]
            );
            
            if (responsables.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El responsable seleccionado no es válido o no está activo'
                });
            }
        }
        
        // Insertar el proyecto (estado por defecto lo define la DB)
        const [result] = await pool.promise().query(
            'INSERT INTO proyectos (nombre, descripcion, fecha_inicio, fecha_fin, responsable_id) VALUES (?, ?, ?, ?, ?)',
            [nombre_proyecto, descripcion_proyecto, fecha_inicio, fecha_fin, responsable]
        );
        
        res.status(201).json({
            success: true,
            message: 'Proyecto creado exitosamente',
            proyecto_id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear el proyecto'
        });
    }
};

// Eliminar un proyecto
exports.eliminarProyecto = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Verificar si el proyecto existe
        const [proyecto] = await pool.promise().query(
            'SELECT id FROM proyectos WHERE id = ?',
            [id]
        );
        
        if (proyecto.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto no encontrado'
            });
        }
        
        // Eliminar el proyecto (las asignaciones se eliminarán automáticamente por la restricción ON DELETE CASCADE)
        await pool.promise().query(
            'DELETE FROM proyectos WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Proyecto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el proyecto'
        });
    }
};

// Obtener un proyecto específico
exports.obtenerProyecto = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [proyecto] = await pool.promise().query(
            `SELECT p.*, u.nombre as jefe_nombre 
             FROM proyectos p 
             LEFT JOIN usuarios u ON p.responsable_id = u.id 
             WHERE p.id = ?`,
            [id]
        );
        
        if (proyecto.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto no encontrado'
            });
        }
        // Traer miembros asignados desde la base de datos
        const [miembros] = await pool.promise().query(
            `SELECT 
                a.id AS asignacion_id,
                u.id AS usuario_id,
                u.nombre,
                u.email,
                u.rol
             FROM asignaciones a
             INNER JOIN usuarios u ON u.id = a.usuario_id
             WHERE a.proyecto_id = ?`,
            [id]
        );

        res.json({
            success: true,
            proyecto: { ...proyecto[0], miembros }
        });
    } catch (error) {
        console.error('Error al obtener proyecto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el proyecto'
        });
    }
};

// Actualizar estado de un proyecto
exports.actualizarEstadoProyecto = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['en_ejecucion', 'en_pausa', 'finalizado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            success: false,
            message: 'Estado no válido'
        });
    }

    try {
        const [existsRows] = await pool.promise().query('SELECT id FROM proyectos WHERE id = ?', [id]);
        if (!existsRows || existsRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
        }
        const [result] = await pool.promise().query('UPDATE proyectos SET estado = ? WHERE id = ?', [estado, id]);
        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'No se pudo actualizar el estado' });
        }
        res.json({ success: true, message: 'Estado del proyecto actualizado' });
    } catch (error) {
        console.error('Error al actualizar estado del proyecto:', error);
        res.status(500).json({ success: false, message: 'Error interno al actualizar estado' });
    }
};