const pool = require('../db/connection');

// Crear una nueva asignación de miembro a proyecto
exports.crearAsignacion = async (req, res) => {
    const { proyecto_id, usuario_id } = req.body;

    if (!proyecto_id || !usuario_id) {
        return res.status(400).json({ success: false, error: 'proyecto_id y usuario_id son obligatorios' });
    }

    try {
        // Validar proyecto y obtener responsable
        const [proyectos] = await pool.promise().query('SELECT id, responsable_id FROM proyectos WHERE id = ?', [proyecto_id]);
        if (proyectos.length === 0) {
            return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        }

        // Permisos: admin o líder responsable del proyecto
        const user = req.session?.user;
        const esAdmin = user && (user.rol === 'admin' || user.rol === 'administrador');
        const esLider = user && user.rol === 'jefe_proyecto';
        const esLiderDelProyecto = esLider && proyectos[0].responsable_id === user.id;
        if (!esAdmin && !esLiderDelProyecto) {
            return res.status(403).json({ success: false, error: 'No autorizado: solo el líder del proyecto o admin puede asignar miembros' });
        }

        // Validar usuario (rol trabajador/miembro activo)
        const [usuarios] = await pool.promise().query("SELECT id FROM usuarios WHERE id = ? AND rol IN ('miembro','trabajador') AND activo = 1", [usuario_id]);
        if (usuarios.length === 0) {
            return res.status(400).json({ success: false, error: 'Usuario no válido o inactivo para asignación' });
        }

        // Evitar duplicados (UNIQUE en DB, pero validamos amigablemente)
        const [existe] = await pool.promise().query('SELECT id FROM asignaciones WHERE proyecto_id = ? AND usuario_id = ?', [proyecto_id, usuario_id]);
        if (existe.length > 0) {
            return res.status(409).json({ success: false, error: 'El usuario ya está asignado a este proyecto' });
        }

        const [result] = await pool.promise().query(
            'INSERT INTO asignaciones (proyecto_id, usuario_id) VALUES (?, ?)',
            [proyecto_id, usuario_id]
        );

        res.status(201).json({ success: true, message: 'Asignación creada', asignacion_id: result.insertId });
    } catch (error) {
        console.error('Error al crear asignación:', error);
        res.status(500).json({ success: false, error: 'Error al crear la asignación' });
    }
};

// Listar asignaciones (por proyecto opcional)
exports.listarAsignaciones = async (req, res) => {
    const { proyecto_id } = req.query;
    try {
        let query = `SELECT a.id, a.proyecto_id, a.usuario_id, a.created_at, p.nombre AS proyecto_nombre, u.nombre AS usuario_nombre
                     FROM asignaciones a
                     INNER JOIN proyectos p ON p.id = a.proyecto_id
                     INNER JOIN usuarios u ON u.id = a.usuario_id`;
        const params = [];
        if (proyecto_id) {
            query += ' WHERE a.proyecto_id = ?';
            params.push(proyecto_id);
        }
        query += ' ORDER BY a.created_at DESC';

        const [rows] = await pool.promise().query(query, params);
        res.json({ success: true, asignaciones: rows });
    } catch (error) {
        console.error('Error al listar asignaciones:', error);
        res.status(500).json({ success: false, error: 'Error al listar asignaciones' });
    }
};

// Eliminar asignación
exports.eliminarAsignacion = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.promise().query('DELETE FROM asignaciones WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Asignación no encontrada' });
        }
        res.json({ success: true, message: 'Asignación eliminada' });
    } catch (error) {
        console.error('Error al eliminar asignación:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar asignación' });
    }
};