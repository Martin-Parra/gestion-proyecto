const connection = require('../db/connection');

// Crear una nueva tarea
const crearTarea = async (req, res) => {
    const { titulo, descripcion, proyecto_id } = req.body;

    try {
        // Verificar que el proyecto existe
        const [proyecto] = await connection.promise().query(
            'SELECT id FROM proyectos WHERE id = ?',
            [proyecto_id]
        );

        if (proyecto.length === 0) {
            return res.status(404).json({
                error: 'El proyecto especificado no existe'
            });
        }

        // Insertar la nueva tarea
        const [result] = await connection.promise().query(
            'INSERT INTO tareas (titulo, descripcion, proyecto_id) VALUES (?, ?, ?)',
            [titulo, descripcion, proyecto_id]
        );

        res.status(201).json({
            message: 'Tarea creada exitosamente',
            tarea_id: result.insertId
        });
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({
            error: 'Error al crear la tarea'
        });
    }
};

// Obtener todas las tareas de un proyecto
const obtenerTareasProyecto = async (req, res) => {
    const { proyecto_id } = req.params;

    try {
        const [tareas] = await connection.promise().query(
            // Ajuste de columna de orden para compatibilidad con la BD real
            'SELECT id, titulo, descripcion, estado, proyecto_id, created_at FROM tareas WHERE proyecto_id = ? ORDER BY created_at DESC',
            [proyecto_id]
        );

        res.json({ success: true, tareas });
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las tareas del proyecto'
        });
    }
};

// Obtener una tarea específica por ID
const obtenerTareaPorId = async (req, res) => {
    const { tarea_id } = req.params;

    try {
        const [tareas] = await connection.promise().query(
            // Seleccionar solo columnas presentes en la BD
            'SELECT id, titulo, descripcion, estado, proyecto_id, created_at FROM tareas WHERE id = ?',
            [tarea_id]
        );

        if (tareas.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tarea no encontrada'
            });
        }

        res.json({ 
            success: true, 
            tarea: tareas[0] 
        });
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener la tarea'
        });
    }
};

// Actualizar el estado de una tarea
const actualizarEstadoTarea = async (req, res) => {
    const { tarea_id } = req.params;
    let { estado } = req.body;

    // Mapear estados del UI a estados internos de la BD
    const uiToDbMap = {
        haciendo: 'en_progreso',
        hecho: 'completada',
        revisando: 'revisando'
    };

    if (uiToDbMap[estado]) {
        estado = uiToDbMap[estado];
    }

    const validEstados = new Set(['pendiente', 'en_progreso', 'revisando', 'completada']);
    if (!validEstados.has(estado)) {
        return res.status(400).json({
            success: false,
            message: 'Estado inválido'
        });
    }

    try {
        const [result] = await connection.promise().query(
            'UPDATE tareas SET estado = ? WHERE id = ?',
            [estado, tarea_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarea no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Estado de la tarea actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar estado de tarea:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Editar una tarea (título y descripción)
const editarTarea = async (req, res) => {
    const { tarea_id } = req.params;
    const { titulo, descripcion } = req.body;

    // Validaciones
    if (!titulo || titulo.trim() === '') {
        return res.status(400).json({
            error: 'El título es obligatorio'
        });
    }

    try {
        const [result] = await connection.promise().query(
            'UPDATE tareas SET titulo = ?, descripcion = ? WHERE id = ?',
            [titulo.trim(), descripcion || '', tarea_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Tarea no encontrada'
            });
        }

        res.json({
            message: 'Tarea actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al editar tarea:', error);
        res.status(500).json({
            error: 'Error al editar la tarea'
        });
    }
};

// Eliminar una tarea
const eliminarTarea = async (req, res) => {
    const { tarea_id } = req.params;

    try {
        const [result] = await connection.promise().query(
            'DELETE FROM tareas WHERE id = ?',
            [tarea_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: 'Tarea no encontrada'
            });
        }

        res.json({
            message: 'Tarea eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({
            error: 'Error al eliminar la tarea'
        });
    }
};

module.exports = {
    crearTarea,
    obtenerTareasProyecto,
    obtenerTareaPorId,
    actualizarEstadoTarea,
    editarTarea,
    eliminarTarea
};