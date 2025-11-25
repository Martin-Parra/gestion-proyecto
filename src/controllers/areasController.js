const pool = require('../db/connection');

async function ensureTables(){
  // Crear tablas si no existen
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS areas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE
    )
  `);
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS proyecto_areas (
      proyecto_id INT NOT NULL,
      area_id INT NOT NULL,
      PRIMARY KEY (proyecto_id, area_id),
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
      FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
    )
  `);
}

exports.listarAreas = async (req, res) => {
  try {
    await ensureTables();
    const [rows] = await pool.promise().query('SELECT id, nombre FROM areas ORDER BY nombre');
    res.json({ success: true, areas: rows });
  } catch (err) {
    console.error('Error al listar áreas:', err);
    res.status(500).json({ success: false, error: 'Error al listar áreas' });
  }
};

exports.crearArea = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ success: false, error: 'Nombre de área requerido' });
  }
  try {
    await ensureTables();
    const [result] = await pool.promise().query('INSERT INTO areas (nombre) VALUES (?)', [nombre.trim()]);
    res.status(201).json({ success: true, area_id: result.insertId });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'El nombre de área ya existe' });
    }
    console.error('Error al crear área:', err);
    res.status(500).json({ success: false, error: 'Error al crear área' });
  }
};

exports.listarAreasProyecto = async (req, res) => {
  const { proyectoId } = req.params;
  try {
    await ensureTables();
    const [rows] = await pool.promise().query(
      `SELECT a.id, a.nombre
       FROM proyecto_areas pa
       INNER JOIN areas a ON a.id = pa.area_id
       WHERE pa.proyecto_id = ?
       ORDER BY a.nombre`,
      [proyectoId]
    );
    res.json({ success: true, areas: rows });
  } catch (err) {
    console.error('Error al listar áreas del proyecto:', err);
    res.status(500).json({ success: false, error: 'Error al listar áreas del proyecto' });
  }
};

exports.asignarAreaAProyecto = async (req, res) => {
  const { proyectoId } = req.params;
  const { area_id } = req.body;
  if (!area_id) return res.status(400).json({ success: false, error: 'area_id es requerido' });
  try {
    await ensureTables();
    // Verificar permisos: admin o líder responsable
    const user = req.session?.user;
    const esAdmin = user && (user.rol === 'admin' || user.rol === 'administrador' || user.rol === 'ceo');
    const [proyRows] = await pool.promise().query('SELECT responsable_id FROM proyectos WHERE id = ?', [proyectoId]);
    if (proyRows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    const esLiderDelProyecto = user && user.rol === 'jefe_proyecto' && proyRows[0].responsable_id === user.id;
    if (!esAdmin && !esLiderDelProyecto) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    // Validar área
    const [areaRows] = await pool.promise().query('SELECT id FROM areas WHERE id = ?', [area_id]);
    if (areaRows.length === 0) return res.status(404).json({ success: false, error: 'Área no encontrada' });

    // Insertar relación
    await pool.promise().query('INSERT INTO proyecto_areas (proyecto_id, area_id) VALUES (?, ?)', [proyectoId, area_id]);
    res.status(201).json({ success: true, message: 'Área asignada' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'El proyecto ya tiene esta área' });
    }
    console.error('Error al asignar área:', err);
    res.status(500).json({ success: false, error: 'Error al asignar área al proyecto' });
  }
};

exports.eliminarAreaDeProyecto = async (req, res) => {
  const { proyectoId, areaId } = req.params;
  try {
    await ensureTables();
    // Verificar permisos
    const user = req.session?.user;
    const esAdmin = user && (user.rol === 'admin' || user.rol === 'administrador' || user.rol === 'ceo');
    const [proyRows] = await pool.promise().query('SELECT responsable_id FROM proyectos WHERE id = ?', [proyectoId]);
    if (proyRows.length === 0) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    const esLiderDelProyecto = user && user.rol === 'jefe_proyecto' && proyRows[0].responsable_id === user.id;
    if (!esAdmin && !esLiderDelProyecto) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    await pool.promise().query('DELETE FROM proyecto_areas WHERE proyecto_id = ? AND area_id = ?', [proyectoId, areaId]);
    res.json({ success: true, message: 'Área eliminada del proyecto' });
  } catch (err) {
    console.error('Error al eliminar área del proyecto:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar área del proyecto' });
  }
};
