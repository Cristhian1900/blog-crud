// Middleware para proteger rutas de administrador
function isAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  req.flash('error', 'Debes iniciar sesión como administrador para acceder a esta página.');
  res.redirect('/login');
}

// Middleware para redirigir si ya está autenticado
function isGuest(req, res, next) {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/blogs');
  }
  next();
}

module.exports = { isAdmin, isGuest };
