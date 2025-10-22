const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Añadir soporte para JSON
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: 'gestion_secret',
    resave: false,
    saveUninitialized: true
}));

// Importar middleware de autenticación
const { isAuthenticated, isAdmin, checkUserStatus } = require('./middleware/auth');

// Rutas
const loginRouter = require('./routes/login');
const usuariosRouter = require('./routes/usuarios'); // Importar rutas de usuarios
const usuarioRouter = require('./routes/usuario'); // Importar rutas de usuario actual
const proyectosRouter = require('./routes/proyectos'); // Importar rutas de proyectos
const tareasRouter = require('./routes/tareas'); // Importar rutas de tareas
const asignacionesRouter = require('./routes/asignaciones'); // Importar rutas de asignaciones
const trabajadorRouter = require('./routes/trabajador'); // Importar rutas de trabajador

app.use('/login', loginRouter);
app.use('/api/usuarios', usuariosRouter); // Añadir rutas de usuarios
app.use('/api/usuario', usuarioRouter); // Añadir rutas de usuario actual
app.use('/api/proyectos', proyectosRouter); // Añadir rutas de proyectos
app.use('/api/tareas', tareasRouter); // Añadir rutas de tareas
app.use('/api/asignaciones', asignacionesRouter); // Añadir rutas de asignaciones
app.use('/api/trabajador', trabajadorRouter); // Añadir rutas de trabajador

// Endpoint para obtener información del usuario autenticado
app.get('/api/auth/me', isAuthenticated, checkUserStatus, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.session.user.id,
            nombre: req.session.user.nombre,
            email: req.session.user.email,
            rol: req.session.user.rol,
            activo: req.session.user.activo
        }
    });
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

app.get('/dashboard/trabajador', isAuthenticated, checkUserStatus, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard_trabajador.html'));
});

app.get('/proyecto-detalle', isAuthenticated, checkUserStatus, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/proyecto_detalle.html'));
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});