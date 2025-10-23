const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const documentos = require('../controllers/documentosController');
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');

// Autenticación para todas las rutas de documentos
router.use(isAuthenticated);
router.use(checkUserStatus);

// Configuración de almacenamiento con carpeta por proyecto
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { proyectoId } = req.params;
    const base = path.join(__dirname, '..', '..', 'uploads', 'proyectos', String(proyectoId));
    fs.mkdirSync(base, { recursive: true });
    cb(null, base);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${sanitized}`);
  }
});

const upload = multer({ storage });

// Listar documentos del proyecto
router.get('/proyectos/:proyectoId/documentos', documentos.listarDocumentos);

// Subir documento al proyecto
router.post('/proyectos/:proyectoId/documentos', upload.single('archivo'), documentos.subirDocumento);

// Descargar documento
router.get('/documentos/:id/download', documentos.descargarDocumento);

// Eliminar documento
router.delete('/documentos/:id', documentos.eliminarDocumento);

module.exports = router;