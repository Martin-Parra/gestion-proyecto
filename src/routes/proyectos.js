const express = require('express');
const router = express.Router();
const proyectosController = require('../controllers/proyectosController');

// Obtener todos los jefes de proyecto
router.get('/jefes', proyectosController.obtenerJefesProyecto);

// Rutas CRUD para proyectos
router.get('/mios', proyectosController.obtenerProyectosDelLiderActual);
router.post('/', proyectosController.crearProyecto);
router.get('/', proyectosController.obtenerProyectos);
router.get('/:id', proyectosController.obtenerProyecto);
router.put('/:id', proyectosController.actualizarProyecto);
router.put('/:id/estado', proyectosController.actualizarEstadoProyecto);
router.delete('/:id', proyectosController.eliminarProyecto);

module.exports = router;