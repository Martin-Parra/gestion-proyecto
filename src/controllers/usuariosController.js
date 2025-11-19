const bcrypt = require('bcryptjs');
const pool = require('../db/connection');

// Normalizar valores de rol provenientes del frontend
function normalizarRol(rol) {
    const mapa = {
        administrador: 'admin',
        miembro: 'trabajador'
    };
    return mapa[rol] || rol;
}

// Crear un nuevo usuario
exports.crearUsuario = (req, res) => {
    const { nombre, email, password, rol } = req.body;
    
    // Validar datos
    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos son obligatorios' 
        });
    }
    
    // Verificar si el email ya existe
    pool.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error al verificar email:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error en el servidor' 
            });
        }
        
        if (results.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'El email ya está registrado' 
            });
        }
        
        // Encriptar la contraseña
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Error al encriptar contraseña:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error en el servidor' 
                });
            }
            
            // Insertar el nuevo usuario
            const nuevoUsuario = {
                nombre,
                email,
                password: hash,
                rol: normalizarRol(rol),
                activo: 1
            };
            
            pool.query('INSERT INTO usuarios SET ?', nuevoUsuario, (err, result) => {
                if (err) {
                    console.error('Error al crear usuario:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error al crear usuario' 
                    });
                }
                
                res.status(201).json({
                    success: true,
                    message: 'Usuario creado exitosamente',
                    userId: result.insertId
                });
            });
        });
    });
};

// Obtener todos los usuarios
exports.obtenerUsuarios = (req, res) => {
    pool.query('SELECT id, nombre, email, rol, activo FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al obtener usuarios' 
            });
        }
        
        res.json({
            success: true,
            usuarios: results
        });
    });
};

// Obtener un usuario por ID
exports.obtenerUsuarioPorId = (req, res) => {
    const userId = req.params.id;
    
    pool.query('SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener datos del usuario'
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            usuario: results[0]
        });
    });
};

// Actualizar usuario
exports.actualizarUsuario = (req, res) => {
    const userId = req.params.id;
    const { nombre, email, password, rol, activo } = req.body;
    
    // Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El nombre es requerido'
        });
    }
    
    if (!email || email.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El email es requerido'
        });
    }
    
    if (!rol || rol.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El rol es requerido'
        });
    }
    
    // Validar que el rol sea válido
    const rolesPermitidos = ['administrador', 'jefe_proyecto', 'miembro', 'admin', 'trabajador'];
    if (!rolesPermitidos.includes(rol)) {
        return res.status(400).json({
            success: false,
            message: 'El rol seleccionado no es válido'
        });
    }
    
    // Si se proporciona contraseña, encriptarla
    if (password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Error al encriptar contraseña:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar usuario'
                });
            }
            
            const usuario = {
                nombre,
                email,
                password: hash,
                rol: normalizarRol(rol),
                activo: activo !== undefined ? activo : 1
            };
            
            actualizarUsuarioEnBD(userId, usuario, req, res);
        });
    } else {
        const usuario = {
            nombre,
            email,
            rol: normalizarRol(rol),
            activo: activo !== undefined ? activo : 1
        };
        
        actualizarUsuarioEnBD(userId, usuario, req, res);
    }
};

// Función auxiliar para actualizar usuario en la BD
function actualizarUsuarioEnBD(userId, usuario, req, res) {
    pool.query('UPDATE usuarios SET ? WHERE id = ?', [usuario, userId], (err, result) => {
        if (err) {
            // Manejo específico de error por email duplicado
            if (err.code === 'ER_DUP_ENTRY') {
                console.error('Email duplicado al actualizar usuario:', err.sqlMessage || err.message);
                return res.status(400).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            
            // Manejo específico de error por datos truncados
            if (err.code === 'WARN_DATA_TRUNCATED' || err.errno === 1265) {
                console.error('Error de datos truncados al actualizar usuario:', err.sqlMessage || err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Los datos proporcionados no son válidos para el campo especificado'
                });
            }
            
            console.error('Error al actualizar usuario:', err);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar usuario'
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Sincronizar sesión si el usuario actualizado es el actual
        try {
            if (req?.session?.user && String(req.session.user.id) === String(userId)) {
                req.session.user.nombre = usuario.nombre;
                req.session.user.email = usuario.email;
                if (usuario.rol) req.session.user.rol = usuario.rol;
                if (typeof usuario.activo !== 'undefined') req.session.user.activo = !!usuario.activo;
            }
        } catch (e) {
            console.warn('Advertencia: no se pudo sincronizar la sesión tras actualizar usuario:', e);
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente'
        });
    });
}

// Eliminar usuario
exports.eliminarUsuario = (req, res) => {
    const userId = req.params.id;
    
    pool.query('DELETE FROM usuarios WHERE id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario'
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    });
};

// Subir y guardar avatar del usuario
exports.guardarAvatar = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Archivo de avatar requerido' });
        }
        const relativeUrl = `/uploads/avatars/${req.file.filename}`;

        // Asegurar que exista registro en perfiles_usuario (la migración ya lo crea, pero por si acaso)
        await pool.promise().query('INSERT IGNORE INTO perfiles_usuario (usuario_id) VALUES (?)', [userId]);
        await pool.promise().query('UPDATE perfiles_usuario SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = ?', [relativeUrl, userId]);

        // Si el que sube es el mismo usuario, refrescar en sesión el avatar (si se usa en cliente)
        try {
            if (req?.session?.user && String(req.session.user.id) === String(userId)) {
                req.session.user.avatar_url = relativeUrl;
            }
        } catch (_) {}

        res.json({ success: true, avatar_url: relativeUrl });
    } catch (err) {
        console.error('Error al guardar avatar:', err);
        res.status(500).json({ success: false, message: 'Error al guardar avatar' });
    }
};