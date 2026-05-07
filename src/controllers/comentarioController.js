const { pool } = require('../config/db');

// POST /blogs/:id/comentarios — Crear comentario
const create = async (req, res) => {
  const { contenido, autor } = req.body;
  const { id } = req.params;
  const errors = [];

  if (!contenido || contenido.trim().length < 3) {
    errors.push('El comentario es obligatorio y debe tener al menos 3 caracteres.');
  }

  if (errors.length) {
    req.flash('error', errors.join(' '));
    return res.redirect(`/blogs/${id}#comentarios`);
  }

  try {
    // Verificar que el blog existe
    const [blogs] = await pool.execute('SELECT id_blog FROM blogs WHERE id_blog = ?', [id]);
    if (!blogs.length) {
      req.flash('error', 'El blog no existe.');
      return res.redirect('/');
    }

    await pool.execute(
      'INSERT INTO comentarios (contenido, autor, id_blog) VALUES (?, ?, ?)',
      [contenido.trim(), (autor || 'Anónimo').trim(), id]
    );

    req.flash('success', '¡Comentario añadido!');
    res.redirect(`/blogs/${id}#comentarios`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al publicar el comentario.');
    res.redirect(`/blogs/${id}#comentarios`);
  }
};

// DELETE /admin/comentarios/:id — Eliminar comentario
const destroy = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id_blog FROM comentarios WHERE id_comentario = ?',
      [req.params.id]
    );

    if (!rows.length) {
      req.flash('error', 'Comentario no encontrado.');
      return res.redirect('/admin/blogs');
    }

    const id_blog = rows[0].id_blog;
    await pool.execute('DELETE FROM comentarios WHERE id_comentario = ?', [req.params.id]);

    req.flash('success', 'Comentario eliminado.');
    res.redirect(`/blogs/${id_blog}#comentarios`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al eliminar el comentario.');
    res.redirect('/admin/blogs');
  }
};

module.exports = { create, destroy };
