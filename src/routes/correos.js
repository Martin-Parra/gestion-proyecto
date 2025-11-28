const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { isAuthenticated, checkUserStatus } = require('../middleware/auth');
const correos = require('../controllers/correosController');

router.use(isAuthenticated);
router.use(checkUserStatus);

// Storage para adjuntos de correos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const base = path.join(__dirname, '..', '..', 'uploads', 'correos', 'tmp');
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

router.get('/inbox', correos.inbox);
router.get('/enviados', correos.sent);
router.get('/unread_count', correos.unreadCount);
router.get('/:id', correos.getOne);
router.post('/', upload.array('adjuntos', 10), correos.send);
router.patch('/:id/leido', correos.markRead);
router.delete('/:id', correos.remove);

module.exports = router;
