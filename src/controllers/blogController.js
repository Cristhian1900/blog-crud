const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

// GET / — Listar todos los blogs
const index = async (req, res) => {
  try {
    const [blogs] = await pool.execute(
      `SELECT b.*, COUNT(c.id_comentario) AS total_comentarios
       FROM blogs b
       LEFT JOIN comentarios c ON b.id_blog = c.id_blog
       GROUP BY b.id_blog
       ORDER BY b.created_at DESC`
    );
    res.render('blogs/index', {
      title: 'BlogsCRUD — Inicio',
      blogs,
      isAdmin: !!req.session.adminId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { title: 'Error del servidor', isAdmin: !!req.session.adminId });
  }
};

// GET /blogs/:id — Mostrar blog con comentarios
const show = async (req, res) => {
  try {
    const [blogs] = await pool.execute('SELECT * FROM blogs WHERE id_blog = ?', [req.params.id]);
    if (!blogs.length) {
      return res.status(404).render('errors/404', { title: 'Blog no encontrado', isAdmin: !!req.session.adminId });
    }
    const blog = blogs[0];

    const [comentarios] = await pool.execute(
      'SELECT * FROM comentarios WHERE id_blog = ? ORDER BY created_at DESC',
      [req.params.id]
    );

    res.render('blogs/show', {
      title: blog.titulo,
      blog,
      comentarios,
      isAdmin: !!req.session.adminId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { title: 'Error del servidor', isAdmin: !!req.session.adminId });
  }
};

// GET /admin/blogs/create — Formulario crear
const createForm = (req, res) => {
  res.render('blogs/create', {
    title: 'Crear Blog',
    isAdmin: !!req.session.adminId,
    errors: [],
  });
};

// POST /admin/blogs — Crear blog
const create = async (req, res) => {
  const { titulo, contenido, autor } = req.body;
  const errors = [];

  if (!titulo || titulo.trim().length < 3) errors.push('El título es obligatorio y debe tener al menos 3 caracteres.');
  if (!contenido || contenido.trim().length < 10) errors.push('El contenido es obligatorio y debe tener al menos 10 caracteres.');

  if (errors.length) {
    // Si hubo error y se subió imagen, eliminarla
    if (req.file && req.file.path && !req.file.path.startsWith('http')) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(422).render('blogs/create', {
      title: 'Crear Blog',
      isAdmin: !!req.session.adminId,
      errors,
      old: req.body,
    });
  }

  try {
    let imagen = null;
    if (req.file) {
      // Cloudinary devuelve .path como URL; local devuelve ruta de archivo
      imagen = req.file.path.startsWith('http')
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    }

    await pool.execute(
      'INSERT INTO blogs (titulo, contenido, imagen, autor) VALUES (?, ?, ?, ?)',
      [titulo.trim(), contenido.trim(), imagen, (autor || 'Admin').trim()]
    );

    req.flash('success', '¡Blog creado exitosamente!');
    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear el blog. Inténtalo de nuevo.');
    res.redirect('/admin/blogs/create');
  }
};

// GET /admin/blogs/:id/edit — Formulario editar
const editForm = async (req, res) => {
  try {
    const [blogs] = await pool.execute('SELECT * FROM blogs WHERE id_blog = ?', [req.params.id]);
    if (!blogs.length) {
      return res.status(404).render('errors/404', { title: 'Blog no encontrado', isAdmin: !!req.session.adminId });
    }
    res.render('blogs/edit', {
      title: 'Editar Blog',
      blog: blogs[0],
      isAdmin: !!req.session.adminId,
      errors: [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { title: 'Error del servidor', isAdmin: !!req.session.adminId });
  }
};

// PUT /admin/blogs/:id — Actualizar blog
const update = async (req, res) => {
  const { titulo, contenido, autor } = req.body;
  const errors = [];

  if (!titulo || titulo.trim().length < 3) errors.push('El título es obligatorio y debe tener al menos 3 caracteres.');
  if (!contenido || contenido.trim().length < 10) errors.push('El contenido es obligatorio y debe tener al menos 10 caracteres.');

  try {
    const [blogs] = await pool.execute('SELECT * FROM blogs WHERE id_blog = ?', [req.params.id]);
    if (!blogs.length) {
      return res.status(404).render('errors/404', { title: 'Blog no encontrado', isAdmin: !!req.session.adminId });
    }

    if (errors.length) {
      if (req.file && req.file.path && !req.file.path.startsWith('http')) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(422).render('blogs/edit', {
        title: 'Editar Blog',
        blog: { ...blogs[0], ...req.body },
        isAdmin: !!req.session.adminId,
        errors,
      });
    }

    let imagen = blogs[0].imagen;
    if (req.file) {
      // Eliminar imagen anterior si es local
      if (imagen && !imagen.startsWith('http')) {
        const oldPath = path.join(__dirname, '../../public', imagen);
        fs.unlink(oldPath, () => {});
      }
      imagen = req.file.path.startsWith('http')
        ? req.file.path
        : `/uploads/${req.file.filename}`;
    }

    await pool.execute(
      'UPDATE blogs SET titulo = ?, contenido = ?, imagen = ?, autor = ? WHERE id_blog = ?',
      [titulo.trim(), contenido.trim(), imagen, (autor || 'Admin').trim(), req.params.id]
    );

    req.flash('success', '¡Blog actualizado exitosamente!');
    res.redirect(`/blogs/${req.params.id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar el blog.');
    res.redirect(`/admin/blogs/${req.params.id}/edit`);
  }
};

// DELETE /admin/blogs/:id — Eliminar blog
const destroy = async (req, res) => {
  try {
    const [blogs] = await pool.execute('SELECT * FROM blogs WHERE id_blog = ?', [req.params.id]);
    if (!blogs.length) {
      req.flash('error', 'Blog no encontrado.');
      return res.redirect('/admin/blogs');
    }

    const blog = blogs[0];
    // Eliminar imagen local si existe
    if (blog.imagen && !blog.imagen.startsWith('http')) {
      const imgPath = path.join(__dirname, '../../public', blog.imagen);
      fs.unlink(imgPath, () => {});
    }

    await pool.execute('DELETE FROM blogs WHERE id_blog = ?', [req.params.id]);
    req.flash('success', 'Blog eliminado correctamente.');
    res.redirect('/admin/blogs');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar el blog.');
    res.redirect('/admin/blogs');
  }
};

// GET /admin/blogs — Panel admin de blogs
const adminIndex = async (req, res) => {
  try {
    const [blogs] = await pool.execute(
      `SELECT b.*, COUNT(c.id_comentario) AS total_comentarios
       FROM blogs b
       LEFT JOIN comentarios c ON b.id_blog = c.id_blog
       GROUP BY b.id_blog
       ORDER BY b.created_at DESC`
    );
    res.render('blogs/admin', {
      title: 'Panel Admin — Blogs',
      blogs,
      isAdmin: !!req.session.adminId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { title: 'Error del servidor', isAdmin: !!req.session.adminId });
  }
};

module.exports = { index, show, createForm, create, editForm, update, destroy, adminIndex };
