const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Helper: envuelve multer para capturar errores y continuar
function handleUpload(req, res, next) {
  upload.single('imagen')(req, res, (err) => {
    if (err) {
      console.error('❌ Error Multer:', err.message);
      req.flash('error', err.message);
      return res.redirect('back');
    }
    if (req.file) {
      console.log('✅ Archivo recibido:', req.file.filename, '|', req.file.mimetype, '|', req.file.size, 'bytes');
    } else {
      console.log('ℹ️ Sin archivo en esta petición');
    }
    next();
  });
}

// Rutas públicas
router.get('/', blogController.index);
router.get('/blogs/:id', blogController.show);

// Rutas protegidas de admin
router.get('/admin/blogs', isAdmin, blogController.adminIndex);
router.get('/admin/blogs/create', isAdmin, blogController.createForm);
router.post('/admin/blogs', isAdmin, handleUpload, blogController.create);
router.get('/admin/blogs/:id/edit', isAdmin, blogController.editForm);
router.put('/admin/blogs/:id', isAdmin, handleUpload, blogController.update);
router.delete('/admin/blogs/:id', isAdmin, blogController.destroy);

module.exports = router;
