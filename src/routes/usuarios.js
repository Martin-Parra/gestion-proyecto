const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Ruta para crear un nuevo usuario
router.post('/', usuariosController.crearUsuario);

// Ruta para obtener todos los usuarios
router.get('/', usuariosController.obtenerUsuarios);

// Ruta para obtener un usuario específico
router.get('/:id', usuariosController.obtenerUsuarioPorId);

// Ruta para actualizar un usuario
router.put('/:id', usuariosController.actualizarUsuario);

// Ruta para eliminar un usuario
router.delete('/:id', usuariosController.eliminarUsuario);

module.exports = router;