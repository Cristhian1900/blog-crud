require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');
const { initDatabase } = require('./src/config/db');

const app = express();

// ── View Engine ──────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ── Confiar en el proxy de Render (necesario para cookies seguras) ──
app.set('trust proxy', 1);


// ── Static Files ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parsing ─────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Method Override (PUT / DELETE en formularios HTML) ───
app.use(methodOverride('_method'));

// ── Session ───────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-dev-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: 'auto', // 'auto' detecta HTTPS automáticamente con trust proxy
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
}));

// ── Flash Messages ────────────────────────────────────────
app.use(flash());

// ── Locals globales para vistas ──────────────────────────
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isAdmin = !!req.session.adminId;
  res.locals.adminUsername = req.session.adminUsername || null;
  next();
});

// ── Rutas ─────────────────────────────────────────────────
app.use('/', require('./src/routes/authRoutes'));
app.use('/', require('./src/routes/blogRoutes'));
app.use('/', require('./src/routes/comentarioRoutes'));

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Página no encontrada', isAdmin: !!req.session.adminId });
});

// ── Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Multer error
  if (err.code === 'LIMIT_FILE_SIZE') {
    req.flash('error', 'El archivo es demasiado grande. Máximo 5MB.');
    return res.redirect('back');
  }
  if (err.message && err.message.includes('Solo se permiten imágenes')) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
  res.status(500).render('errors/500', { title: 'Error del servidor', isAdmin: !!req.session.adminId });
});

// ── Iniciar servidor ──────────────────────────────────────
const PORT = process.env.PORT || 3000;

initDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📌 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} ya está en uso. Cierra el proceso anterior o cambia PORT en .env`);
      } else {
        console.error('❌ Error del servidor:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('❌ No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });

module.exports = app;
