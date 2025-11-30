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
                pool.query('UPDATE usuarios SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id], (e) => {
                    if (e) {
                        console.error('Error actualizando last_login:', e);
                    } else {
                        pool.query('SELECT last_login FROM usuarios WHERE id = ?', [user.id], (e2, r2) => {
                            if (e2) {
                                console.error('Error consultando last_login:', e2);
                            } else {
                                const v = r2 && r2[0] ? r2[0].last_login : null;
                                console.log('Login: last_login actualizado para', user.id, '=>', v);
                            }
                        });
                    }
                });
                
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
