require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const pool = require('./db/connection');

const app = express();
(
    async () => {
        try {
            const [cols] = await pool.promise().query("SHOW COLUMNS FROM usuarios LIKE 'last_login'");
            if (!cols || cols.length === 0) {
                await pool.promise().query("ALTER TABLE usuarios ADD COLUMN last_login DATETIME NULL");
            }
        } catch (_) {}
    }
)();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Añadir soporte para JSON
app.use(session({
    secret: 'gestion_secret',
    resave: false,
    saveUninitialized: true,
    // Solicitud del usuario: desactivar HttpOnly para poder acceder a la cookie desde el cliente
    cookie: {
        httpOnly: false
    }
}));

// Importar middleware de autenticación
const { isAuthenticated, isAdmin, checkUserStatus, isLeader } = require('./middleware/auth');

// Rutas
const loginRouter = require('./routes/login');
const usuariosRouter = require('./routes/usuarios'); // Importar rutas de usuarios
const usuarioRouter = require('./routes/usuario'); // Importar rutas de usuario actual
const proyectosRouter = require('./routes/proyectos'); // Importar rutas de proyectos
const tareasRouter = require('./routes/tareas'); // Importar rutas de tareas
const asignacionesRouter = require('./routes/asignaciones'); // Importar rutas de asignaciones
const trabajadorRouter = require('./routes/trabajador'); // Importar rutas de trabajador
const areasRouter = require('./routes/areas'); // Rutas de áreas
const documentosRouter = require('./routes/documentos'); // Rutas de documentos
const correosRouter = require('./routes/correos'); // Rutas de correo
const passwordRouter = require('./routes/password'); // Recuperación de contraseña

// IMPORTANTE: Las rutas de API deben ir ANTES de los archivos estáticos
app.use('/login', loginRouter);
app.use('/api/usuarios', usuariosRouter); // Añadir rutas de usuarios
app.use('/api/usuario', usuarioRouter); // Añadir rutas de usuario actual
app.use('/api/proyectos', proyectosRouter); // Añadir rutas de proyectos
app.use('/api/tareas', tareasRouter); // Añadir rutas de tareas
app.use('/api/asignaciones', asignacionesRouter); // Añadir rutas de asignaciones
app.use('/api/trabajador', trabajadorRouter); // Añadir rutas de trabajador
app.use('/api/areas', areasRouter); // Añadir rutas de áreas
app.use('/api/correos', correosRouter); // Añadir rutas de correo
app.use('/api/password', passwordRouter); // Rutas de recuperación
// Montar el router genérico de documentos AL FINAL para no interceptar otras rutas de /api
app.use('/api', documentosRouter); // Añadir rutas de documentos

// Archivos estáticos DESPUÉS de las rutas de API
app.use(express.static(path.join(__dirname, '../public')));
// Servir archivos subidos de forma segura bajo /uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoint para obtener información del usuario autenticado (siempre fresco desde BD)
app.get('/api/auth/me', isAuthenticated, checkUserStatus, async (req, res) => {
    try {
        const userId = req.session?.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'No autenticado' });
        const [rows] = await pool.promise().query(
            `SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.last_login, p.avatar_url
             FROM usuarios u
             LEFT JOIN perfiles_usuario p ON p.usuario_id = u.id
             WHERE u.id = ?`,
            [userId]
        );
        const u = rows[0];
        if (!u) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        console.log('auth/me: usuario', userId, 'last_login (pre):', u.last_login);
        if (!u.last_login) {
            try {
                await pool.promise().query('UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
                const [r2] = await pool.promise().query('SELECT last_login FROM usuarios WHERE id = ?', [userId]);
                u.last_login = r2[0]?.last_login || u.last_login;
                console.log('auth/me: usuario', userId, 'last_login (post update):', u.last_login);
            } catch (_) {}
        }
        console.log('auth/me: usuario', userId, 'last_login (final):', u.last_login);
        res.json({ success: true, user: u });
    } catch (err) {
        console.error('Error en /api/auth/me:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Verificar contraseña actual del usuario autenticado
app.post('/api/auth/verify_password', isAuthenticated, checkUserStatus, async (req, res) => {
    try {
        const { password } = req.body || {};
        if (!password) return res.status(400).json({ success: false, message: 'Contraseña requerida' });
        const userId = req.session?.user?.id;
        const [rows] = await pool.promise().query('SELECT password FROM usuarios WHERE id = ?', [userId]);
        const hashed = rows[0]?.password;
        if (!hashed) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        const bcrypt = require('bcryptjs');
        const ok = await bcrypt.compare(password, hashed);
        res.json({ success: true, valid: !!ok });
    } catch (err) {
        console.error('Error en verify_password:', err);
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
});

// Endpoint para cerrar sesión
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    });
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

// Rutas protegidas
app.get('/dashboard/admin', isAuthenticated, checkUserStatus, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard_admin.html'));
});

app.get('/dashboard/ceo', isAuthenticated, checkUserStatus, (req, res) => {
    const u = req.session && req.session.user;
    if (!u || u.rol !== 'ceo') return res.redirect('/login?error=access');
    res.sendFile(path.join(__dirname, '../public/ceo.html'));
});

app.get('/dashboard/trabajador', isAuthenticated, checkUserStatus, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard_trabajador.html'));
});

app.get('/proyecto-detalle', isAuthenticated, checkUserStatus, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/proyecto_detalle.html'));
});
// Página única de correo (para cualquier rol autenticado)
app.get('/correo', isAuthenticated, checkUserStatus, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/correo.html'));
});

// Página: dashboard del líder de proyecto
// Redirigir a la página principal de líder (mis proyectos)
app.get('/dashboard/lider', isAuthenticated, checkUserStatus, isLeader, (req, res) => {
    res.redirect('/dashboard/lider/misproyectos');
});

// Páginas seccionadas para líder de proyecto
app.get('/dashboard/lider/misproyectos', isAuthenticated, checkUserStatus, isLeader, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/lider_proyectos.html'));
});
app.get('/dashboard/lider/asignacion', isAuthenticated, checkUserStatus, isLeader, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/lider_asignacion.html'));
});
app.get('/dashboard/lider/areas', isAuthenticated, checkUserStatus, isLeader, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/lider_areas.html'));
});
app.get('/dashboard/lider/documentos', isAuthenticated, checkUserStatus, isLeader, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/lider_documentos.html'));
});

// Página: detalle de proyecto para admin
app.get('/admin/proyecto/:id', isAuthenticated, checkUserStatus, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/proyecto_admin_detalle.html'));
});

// Página: crear nuevo usuario
app.get('/admin/usuarios/nuevo', isAuthenticated, checkUserStatus, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/usuarios_nuevo.html'));
});

// Página: crear nuevo proyecto
app.get('/admin/proyectos/nuevo', isAuthenticated, checkUserStatus, isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/proyectos_nuevo.html'));
});

// Página pública de restablecimiento de contraseña
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/reset_password.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
