const express = require('express');
const router = express.Router();
const { crearTarea, obtenerTareasProyecto, obtenerTareaPorId, actualizarEstadoTarea, editarTarea, eliminarTarea } = require('../controllers/tareasController');
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);
router.use(checkUserStatus);

// Crear una nueva tarea
router.post('/', crearTarea);

// Obtener todas las tareas de un proyecto (ruta específica primero)
router.get('/proyecto/:proyecto_id', obtenerTareasProyecto);

// Actualizar el estado de una tarea (ruta específica primero)
router.put('/:tarea_id/estado', actualizarEstadoTarea);

// Obtener una tarea específica por ID
router.get('/:tarea_id', obtenerTareaPorId);

// Editar una tarea (título y descripción)
router.put('/:tarea_id', editarTarea);

// Eliminar una tarea
router.delete('/:tarea_id', eliminarTarea);

module.exports = router;