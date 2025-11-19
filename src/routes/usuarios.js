const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const usuariosController = require('../controllers/usuariosController');
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');

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

// --- Avatar upload ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const base = path.join(__dirname, '..', '..', 'uploads', 'avatars');
    fs.mkdirSync(base, { recursive: true });
    cb(null, base);
  },
  filename: function (req, file, cb) {
    const userId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '';
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});
const upload = multer({ storage });

// Subir avatar del usuario actual
router.post('/:id/avatar', isAuthenticated, checkUserStatus, upload.single('avatar'), usuariosController.guardarAvatar);

module.exports = router;