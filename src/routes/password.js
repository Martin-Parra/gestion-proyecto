const express = require('express');
const router = express.Router();
const { requestReset, validateToken, resetPassword } = require('../controllers/passwordController');

console.log('Password routes loaded');

// Rutas públicas (no requieren estar autenticado)
router.post('/forgot', requestReset);
router.get('/reset/validate', validateToken);
router.post('/reset', resetPassword);

module.exports = router;