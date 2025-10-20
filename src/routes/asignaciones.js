const express = require('express');
const router = express.Router();
const { crearAsignacion, listarAsignaciones, eliminarAsignacion } = require('../controllers/asignacionesController');
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');

// Middleware de autenticación
router.use(isAuthenticated);
router.use(checkUserStatus);

// Crear asignación
router.post('/', crearAsignacion);

// Listar asignaciones (opcionalmente por proyecto_id)
router.get('/', listarAsignaciones);

// Eliminar asignación
router.delete('/:id', eliminarAsignacion);

module.exports = router;