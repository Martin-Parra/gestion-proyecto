const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Ruta para obtener la información del usuario actual
router.get('/info', isAuthenticated, (req, res) => {
    // Devolver la información del usuario almacenada en la sesión
    res.json({
        success: true,
        usuario: {
            id: req.session.user.id,
            nombre: req.session.user.nombre,
            email: req.session.user.email,
            rol: req.session.user.rol,
            activo: req.session.user.activo
        }
    });
});

module.exports = router;