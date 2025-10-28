const express = require('express');
const router = express.Router();
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');
const areas = require('../controllers/areasController');

router.use(isAuthenticated);
router.use(checkUserStatus);

// Áreas catalogo
router.get('/', areas.listarAreas);
router.post('/', areas.crearArea);

// Áreas por proyecto
router.get('/proyectos/:proyectoId', areas.listarAreasProyecto);
router.post('/proyectos/:proyectoId', areas.asignarAreaAProyecto);
router.delete('/proyectos/:proyectoId/:areaId', areas.eliminarAreaDeProyecto);

module.exports = router;