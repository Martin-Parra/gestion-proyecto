const pool = require('../db/connection');
const fs = require('fs');
const path = require('path');

async function getUserByEmails(emails){
  if (!emails || emails.length === 0) return [];
  const placeholders = emails.map(() => '?').join(',');
  const [rows] = await pool.promise().query(`SELECT id, email, nombre FROM usuarios WHERE email IN (${placeholders})`, emails);
  return rows;
}

function normalizeListField(body, key){
  const raw = body?.[key];
  if (!raw) return [];
  if (Array.isArray(raw)){
    // Puede venir como ['a@x.com','b@y.com'] o como ['a@x.com,b@y.com']
    return raw.flatMap(v=>String(v).split(',')).map(s=>s.trim()).filter(Boolean);
  }
  return String(raw).split(',').map(s=>s.trim()).filter(Boolean);
}

exports.inbox = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const [rows] = await pool.promise().query(`
      SELECT c.id as id,
             c.asunto,
             c.fecha_envio,
             cd.leido,
             u.nombre as remitente_nombre,
             u.email as remitente
      FROM correo_destinatarios cd
      JOIN correos c ON c.id = cd.correo_id
      JOIN usuarios u ON u.id = c.remitente_id
      WHERE cd.usuario_id = ? AND cd.eliminado = 0
      ORDER BY c.fecha_envio DESC
    `,[userId]);
    res.json(rows);
  } catch (e) {
    console.error(e); res.status(500).json({error:'Error al obtener bandeja de entrada'});
  }
};

exports.sent = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const [rows] = await pool.promise().query(`
      SELECT c.id, c.asunto, c.fecha_envio,
             GROUP_CONCAT(u.email SEPARATOR ', ') as destinatarios,
             MAX(cd.leido) AS leido
      FROM correos c
      JOIN correo_destinatarios cd ON cd.correo_id = c.id
      JOIN usuarios u ON u.id = cd.usuario_id
      WHERE c.remitente_id = ? AND cd.eliminado = 0
      GROUP BY c.id
      ORDER BY c.fecha_envio DESC
    `,[userId]);
    res.json(rows);
  } catch (e) {
    console.error(e); res.status(500).json({error:'Error al obtener enviados'});
  }
};

exports.getOne = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.session?.user?.id;
    const [rows] = await pool.promise().query(`
      SELECT c.id, c.asunto, c.cuerpo, c.fecha_envio,
             ur.email as remitente, ur.nombre as remitente_nombre,
             GROUP_CONCAT(CASE WHEN cd.tipo='to' THEN ud.email END) as para,
             GROUP_CONCAT(CASE WHEN cd.tipo='cc' THEN ud.email END) as cc,
             GROUP_CONCAT(CASE WHEN cd.tipo='bcc' THEN ud.email END) as bcc,
             MAX(CASE WHEN cd.usuario_id=? THEN cd.leido END) as leido
      FROM correos c
      JOIN usuarios ur ON ur.id = c.remitente_id
      JOIN correo_destinatarios cd ON cd.correo_id = c.id
      JOIN usuarios ud ON ud.id = cd.usuario_id
      WHERE c.id = ?
      GROUP BY c.id
    `,[userId, id]);
    const m = rows && rows[0] ? rows[0] : {};

    // Adjuntos
    const [adj] = await pool.promise().query(`SELECT id, nombre_original, archivo, mime, tamano FROM correo_adjuntos WHERE correo_id = ?`, [id]);
    const adjuntos = (adj || []).map(a => ({ id: a.id, nombre: a.nombre_original, url: `/uploads/${a.archivo}`, mime: a.mime, tamano: a.tamano }));

    res.json({ ...m, adjuntos });
  } catch (e) {
    console.error(e); res.status(500).json({error:'Error al obtener el correo'});
  }
};

exports.send = async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    let { asunto, cuerpo } = req.body || {};
    const to_emails = normalizeListField(req.body, 'to_emails');
    const cc_emails = normalizeListField(req.body, 'cc_emails');
    const bcc_emails = normalizeListField(req.body, 'bcc_emails');
    if(!to_emails.length) return res.status(400).json({error:'Debe indicar destinatarios'});

    const [cresult] = await pool.promise().query(
      `INSERT INTO correos (remitente_id, asunto, cuerpo, es_borrador, fecha_envio) VALUES (?,?,?,?, NOW())`,
      [userId, asunto||null, cuerpo||null, 0]
    );
    const idCorreo = cresult.insertId;

    const all = [
      ...to_emails.map(e=>({email:e,tipo:'to'})),
      ...cc_emails.map(e=>({email:e,tipo:'cc'})),
      ...bcc_emails.map(e=>({email:e,tipo:'bcc'})),
    ];

    const emails = all.map(a=>a.email);
    if (emails.length){
      const placeholders = emails.map(()=>'?').join(',');
      const [userRows] = await pool.promise().query(`SELECT id, email FROM usuarios WHERE email IN (${placeholders})`, emails);
      const map = Object.fromEntries(userRows.map(u=>[u.email,u.id]));
      const values = all.filter(a=>map[a.email]).map(a=>[idCorreo, map[a.email], a.tipo]);
      if(values.length){
        const placeholdersIns = values.map(()=>'(?,?,?)').join(',');
        await pool.promise().query(`INSERT INTO correo_destinatarios (correo_id, usuario_id, tipo) VALUES ${placeholdersIns}`, values.flat());
      }
    }

    // Asegurar tabla de adjuntos existe (por si no ejecutaron script)
    await pool.promise().query(`
      CREATE TABLE IF NOT EXISTS correo_adjuntos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correo_id INT NOT NULL,
        nombre_original VARCHAR(255) NOT NULL,
        archivo VARCHAR(300) NOT NULL,
        mime VARCHAR(150) NULL,
        tamano BIGINT NULL,
        fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (correo_id) REFERENCES correos(id) ON DELETE CASCADE,
        INDEX idx_correo_adj (correo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Mover ficheros subidos a carpeta del correo y registrar
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length){
      const targetDir = path.join(__dirname, '..', '..', 'uploads', 'correos', String(idCorreo));
      fs.mkdirSync(targetDir, { recursive: true });
      const valuesAdj = [];
      for (const f of files){
        const finalPath = path.join(targetDir, path.basename(f.filename));
        // mover desde tmp
        try {
          fs.renameSync(f.path, finalPath);
        } catch {
          // si multer no provee .path en esta versión, reconstruimos
          const tmp = path.join(__dirname, '..', '..', 'uploads', 'correos', 'tmp', path.basename(f.filename));
          if (fs.existsSync(tmp)) fs.renameSync(tmp, finalPath);
        }
        const rel = path.join('correos', String(idCorreo), path.basename(f.filename)).replace(/\\/g,'/');
        valuesAdj.push([idCorreo, f.originalname, rel, f.mimetype || null, f.size || null]);
      }
      if (valuesAdj.length){
        const placeholdersAdj = valuesAdj.map(()=>'(?,?,?,?,?)').join(',');
        await pool.promise().query(`INSERT INTO correo_adjuntos (correo_id, nombre_original, archivo, mime, tamano) VALUES ${placeholdersAdj}`, valuesAdj.flat());
      }
    }

    res.json({ok:true, id:idCorreo});
  } catch (e) {
    console.error(e); res.status(500).json({error:'Error al enviar el correo'});
  }
};

exports.markRead = async (req, res) => {
  try {
    const id = req.params.id; const userId = req.session?.user?.id;
    await pool.promise().query(`UPDATE correo_destinatarios SET leido=1, fecha_leido=NOW() WHERE correo_id=? AND usuario_id=?`, [id, userId]);
    res.json({ok:true});
  } catch (e) { console.error(e); res.status(500).json({error:'Error al marcar leído'}); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id; const userId = req.session?.user?.id;
    await pool.promise().query(`UPDATE correo_destinatarios SET eliminado=1 WHERE correo_id=? AND usuario_id=?`, [id, userId]);
    res.json({ok:true});
  } catch (e) { console.error(e); res.status(500).json({error:'Error al eliminar'}); }
};