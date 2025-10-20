const express = require('express');
const router = express.Router();
const path = require('path');
const loginController = require('../controllers/loginController');

// Ruta para mostrar la página de login
router.get('/', (req, res) => {
    // Si hay un error en la URL, mostrarlo
    const error = req.query.error;
    let errorMessage = '';
    
    if (error === 'inactive') {
        errorMessage = 'Su cuenta ha sido desactivada. Contacte al administrador.';
    }
    
    // Enviar la página de login
    res.sendFile(path.join(__dirname, '../../public/login.html'));
});

// Ruta para procesar el login
router.post('/', loginController.login);

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;