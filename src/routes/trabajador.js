const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');

// Middleware para verificar que el usuario sea trabajador o miembro
const requireTrabajador = (req, res, next) => {
    if (req.session.user && (req.session.user.rol === 'trabajador' || req.session.user.rol === 'miembro')) {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo trabajadores pueden acceder a esta funcionalidad.'
        });
    }
};

// Aplicar middleware de autenticación a todas las rutas
router.use(isAuthenticated);
router.use(checkUserStatus);
router.use(requireTrabajador);

// Rutas del trabajador
router.get('/proyecto', trabajadorController.obtenerProyectoAsignado);
router.get('/proyecto/:id', trabajadorController.obtenerDetalleProyecto);
router.get('/tareas', trabajadorController.obtenerTareasAsignadas);
router.put('/tareas/:id/estado', trabajadorController.actualizarEstadoTarea);

module.exports = router;