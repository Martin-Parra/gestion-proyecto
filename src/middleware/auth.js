// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }

    // Si es una ruta de API, devolver JSON en lugar de redireccionar
    if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    res.redirect('/login');
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.rol === 'administrador' || req.session.user.rol === 'admin' || req.session.user.rol === 'ceo')) {
        return next();
    }

    // Si es una ruta de API, devolver JSON en lugar de redireccionar
    if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: 'Acceso denegado - Se requieren permisos de administrador' });
    }

    res.redirect('/login?error=access');
};

// Middleware para verificar si el usuario está activo
const checkUserStatus = (req, res, next) => {
    // Este middleware asume que el usuario ya está autenticado
    // y que su información está en la sesión
    const pool = require('../db/connection');

    pool.query('SELECT activo FROM usuarios WHERE id = ?', [req.session.user.id], (err, results) => {
        if (err) {
            console.error('Error al verificar estado del usuario:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length === 0 || !results[0].activo) {
            // Destruir la sesión si el usuario ya no está activo
            req.session.destroy();

            // Si es una ruta de API, devolver JSON en lugar de redireccionar
            if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({ error: 'Usuario inactivo' });
            }

            return res.redirect('/login?error=inactive');
        }

        next();
    });
};

module.exports = {
    isAuthenticated,
    isAdmin,
    checkUserStatus,
    // Nuevo: verificar si el usuario es líder de proyecto
    isLeader: (req, res, next) => {
        if (req.session.user && req.session.user.rol === 'jefe_proyecto') {
            return next();
        }

        if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
            return res.status(403).json({ error: 'Acceso denegado - Se requieren permisos de líder de proyecto' });
        }

        return res.redirect('/login?error=access');
    }
};
