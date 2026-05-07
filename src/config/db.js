const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog_crud',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Inicializar tablas y admin por defecto
async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    // Tabla blogs
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id_blog INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT NOT NULL,
        imagen VARCHAR(500) DEFAULT NULL,
        autor VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabla comentarios
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id_comentario INT AUTO_INCREMENT PRIMARY KEY,
        contenido TEXT NOT NULL,
        autor VARCHAR(100) DEFAULT 'Anónimo',
        id_blog INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_blog) REFERENCES blogs(id_blog) ON DELETE CASCADE
      )
    `);

    // Tabla admins
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear admin por defecto si no existe
    const bcrypt = require('bcryptjs');
    const [rows] = await conn.execute('SELECT id FROM admins WHERE username = ?', [
      process.env.ADMIN_USERNAME || 'admin',
    ]);
    if (rows.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await conn.execute('INSERT INTO admins (username, password) VALUES (?, ?)', [
        process.env.ADMIN_USERNAME || 'admin',
        hash,
      ]);
      console.log('✅ Admin por defecto creado:', process.env.ADMIN_USERNAME || 'admin');
    }

    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDatabase };
