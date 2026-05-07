const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// GET /login
const loginForm = (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión — Admin',
    isAdmin: false,
  });
};

// POST /login
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.flash('error', 'Usuario y contraseña son obligatorios.');
    return res.redirect('/login');
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ?', [username]);

    if (!rows.length) {
      req.flash('error', 'Credenciales incorrectas.');
      return res.redirect('/login');
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      req.flash('error', 'Credenciales incorrectas.');
      return res.redirect('/login');
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.flash('success', `¡Bienvenido, ${admin.username}!`);
    res.redirect('/admin/blogs');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error del servidor. Inténtalo de nuevo.');
    res.redirect('/login');
  }
};

// GET /logout
const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

module.exports = { loginForm, login, logout };
