const path = require('path');
const fs = require('fs');
const pool = require('../db/connection');

exports.listarDocumentos = async (req, res) => {
  const { proyectoId } = req.params;
  try {
    const [rows] = await pool.promise().query(
      `SELECT d.id, d.proyecto_id, d.usuario_id, u.nombre AS subido_por,
              d.nombre_archivo, d.ruta, d.tipo, d.tamano,
              d.fecha_subida, d.fecha_vencimiento
       FROM documentos d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.proyecto_id = ?
       ORDER BY d.fecha_subida DESC`,
      [proyectoId]
    );
    res.json({ success: true, documentos: rows });
  } catch (err) {
    console.error('Error al listar documentos:', err);
    res.status(500).json({ success: false, message: 'Error al listar documentos' });
  }
};

exports.subirDocumento = async (req, res) => {
  const { proyectoId } = req.params;
  const usuarioId = req.session?.user?.id || null;
  const { fecha_vencimiento, nombre } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ success: false, message: 'Archivo requerido' });

  try {
    const relativePath = path.relative(path.join(__dirname, '..', '..'), file.path).replace(/\\/g, '/');

    // Si el usuario proporciona un nombre, lo usamos como nombre_archivo (preservando extensión)
    const originalExt = path.extname(file.originalname) || '';
    let displayName = (nombre && nombre.trim()) ? nombre.trim() : file.originalname;
    // Añadir extensión si no viene incluida en el nombre personalizado
    if (nombre && nombre.trim()){
      const lower = displayName.toLowerCase();
      const extLower = originalExt.toLowerCase();
      if (extLower && !lower.endsWith(extLower)) {
        displayName = displayName + originalExt;
      }
    }

    const [result] = await pool.promise().query(
      `INSERT INTO documentos (proyecto_id, usuario_id, nombre_archivo, ruta, tipo, tamano, fecha_vencimiento)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [proyectoId, usuarioId, displayName, `/${relativePath}`, file.mimetype, file.size, fecha_vencimiento || null]
    );

    res.status(201).json({ success: true, documento_id: result.insertId });
  } catch (err) {
    console.error('Error al guardar documento:', err);
    res.status(500).json({ success: false, message: 'Error al subir documento' });
  }
};

exports.descargarDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.promise().query('SELECT nombre_archivo, ruta FROM documentos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    const doc = rows[0];
    const abs = path.join(__dirname, '..', '..', doc.ruta.replace(/^\//, ''));
    return res.download(abs, doc.nombre_archivo);
  } catch (err) {
    console.error('Error al descargar documento:', err);
    res.status(500).json({ success: false, message: 'Error al descargar' });
  }
};

exports.eliminarDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.promise().query('SELECT ruta FROM documentos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    const ruta = rows[0].ruta;
    const abs = path.join(__dirname, '..', '..', ruta.replace(/^\//, ''));

    await pool.promise().query('DELETE FROM documentos WHERE id = ?', [id]);

    // Borrar archivo del disco si existe
    fs.unlink(abs, () => {});

    res.json({ success: true, message: 'Documento eliminado' });
  } catch (err) {
    console.error('Error al eliminar documento:', err);
    res.status(500).json({ success: false, message: 'Error al eliminar documento' });
  }
};