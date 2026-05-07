const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarioController');
const { isAdmin } = require('../middlewares/auth');

// Crear comentario (público)
router.post('/blogs/:id/comentarios', comentarioController.create);

// Eliminar comentario (admin)
router.delete('/admin/comentarios/:id', isAdmin, comentarioController.destroy);

module.exports = router;
