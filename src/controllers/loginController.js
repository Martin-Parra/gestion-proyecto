const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const pool = require('../db/connection');

exports.login = (req, res) => {
    const { username, password } = req.body;
    const loginId = String(username || '').trim().toLowerCase();
    console.log('Intento de login:', loginId);
    
    pool.query('SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = ?', [loginId], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (results.length === 0) {
            console.log('Usuario no encontrado:', loginId);
            return res.redirect('/login?error=auth');
        }
        
        const user = results[0];
        console.log('Usuario encontrado:', user.email, 'Rol:', user.rol, 'Estado:', user.activo ? 'Activo' : 'Inactivo');
        
        // Verificar si el usuario está activo
        if (!user.activo) {
            console.log('Usuario inactivo, acceso denegado:', user.email);
            return res.redirect('/login?error=inactive');
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error en la comparación de contraseñas:', err);
                return res.status(500).send('Error en el servidor');
            }
            
            if (isMatch) {
                console.log('Contraseña correcta para:', user.email);
                req.session.user = { 
                    id: user.id, 
                    email: user.email,
                    nombre: user.nombre,
                    rol: user.rol,
                    activo: user.activo
                };
                
                if (user.rol === 'ceo') {
                    console.log('Redirigiendo a dashboard CEO');
                    res.redirect('/dashboard/ceo');
                } else if (user.rol === 'administrador' || user.rol === 'admin') {
                    console.log('Redirigiendo a dashboard admin');
                    res.redirect('/dashboard/admin');
                } else if (user.rol === 'jefe_proyecto') {
                    console.log('Redirigiendo a dashboard líder');
                    res.redirect('/dashboard/lider/misproyectos');
                } else {
                    console.log('Redirigiendo a dashboard trabajador');
                    res.redirect('/dashboard/trabajador');
                }
            } else {
                console.log('Contraseña incorrecta para:', user.email);
                res.redirect('/login?error=auth');
            }
        });
    });
};
