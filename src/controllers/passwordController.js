const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const pool = require('../db/connection');

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function buildResetUrl(req, token) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

async function getUserByEmail(email) {
  const [rows] = await pool.promise().query('SELECT id, email, nombre FROM usuarios WHERE email = ?', [email]);
  return rows[0];
}

async function saveToken(usuarioId, token, expiresAt) {
  await pool.promise().query(
    'INSERT INTO password_resets (usuario_id, token, expires_at, used) VALUES (?, ?, ?, 0)',
    [usuarioId, token, expiresAt]
  );
}

async function markTokenUsed(token) {
  await pool.promise().query('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
}

async function findValidToken(token) {
  const [rows] = await pool.promise().query(
    'SELECT pr.*, u.email FROM password_resets pr JOIN usuarios u ON pr.usuario_id = u.id WHERE pr.token = ? AND pr.used = 0 AND pr.expires_at > NOW()',
    [token]
  );
  return rows[0];
}

async function createTransport() {
  // Usa configuración de entorno si está disponible; si no, crea cuenta de prueba en Ethereal
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      logger: true,
      debug: true
    });
  }
  // Crear cuenta de prueba en Ethereal y usarla
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
}

exports.requestReset = async (req, res) => {
  try {
    console.log('=== INICIO requestReset ===');
    console.log('Body recibido:', req.body);
    console.log('Headers:', req.headers);
    
    const { email } = req.body;
    if (!email) {
      console.log('Error: Email no proporcionado');
      return res.status(400).json({ success: false, message: 'Correo requerido' });
    }

    console.log('Buscando usuario con email:', email);
    const user = await getUserByEmail(email);
    console.log('Usuario encontrado:', user ? 'Sí' : 'No');
    
    // Responder siempre éxito (para no revelar existencia del correo)
    if (!user) {
      console.log('Usuario no encontrado, respondiendo éxito por seguridad');
      return res.json({ success: true, message: 'Si el correo existe, enviamos un enlace de restablecimiento.' });
    }

    console.log('Generando token...');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = hoursFromNow(1);
    
    console.log('Guardando token en BD...');
    await saveToken(user.id, token, expiresAt);

    console.log('Construyendo URL de reset...');
    const resetUrl = buildResetUrl(req, token);
    console.log('URL generada:', resetUrl);
    
    console.log('Creando transporte de email...');
    const transport = await createTransport();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@proyectos.local',
      to: user.email,
      subject: 'Restablece tu contraseña',
      html: `
        <div style="font-family:Arial,sans-serif;color:#111">
          <h2>Restablecer contraseña</h2>
          <p>Hola ${user.nombre || ''}, solicitaste restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para continuar. El enlace expira en 1 hora.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#ff6a3d;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Restablecer contraseña</a></p>
          <p>Si no solicitaste esto, ignora este correo.</p>
        </div>
      `
    };

    console.log('Enviando correo...');
    try {
      const info = await transport.sendMail(mailOptions);
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        console.log('Vista previa del correo:', preview);
      }
      console.log('Correo enviado exitosamente');
    } catch (mailErr) {
      console.error('Error enviando correo:', mailErr);
      // No fallar la respuesta por error de correo
    }

    console.log('Respondiendo éxito');
    res.json({ success: true, message: 'Si el correo existe, enviamos un enlace de restablecimiento.' });
  } catch (err) {
    console.error('Error en requestReset:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

exports.validateToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token requerido' });
    const record = await findValidToken(token);
    if (!record) return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error en validateToken:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Datos incompletos' });
    const record = await findValidToken(token);
    if (!record) return res.status(400).json({ success: false, message: 'Token inválido o expirado' });

    const hash = await bcrypt.hash(password, 10);
    await pool.promise().query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, record.usuario_id]);
    await markTokenUsed(token);

    res.json({ success: true });
  } catch (err) {
    console.error('Error en resetPassword:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};