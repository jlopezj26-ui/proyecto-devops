const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDB = async () => {
  // Agrega las columnas nuevas si la tabla ya existía (migración segura)
  const queries = [
    `CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(255) NOT NULL,
      completed  BOOLEAN      NOT NULL DEFAULT FALSE,
      priority   VARCHAR(10)  NOT NULL DEFAULT 'media',
      deadline   DATE,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );`,
    // Agrega columnas a tablas existentes sin romper datos previos
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority  VARCHAR(10) NOT NULL DEFAULT 'media';`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline  DATE;`,
  ];

  try {
    for (const q of queries) await pool.query(q);
    console.log('✅  Tabla "tasks" lista.');
  } catch (err) {
    console.error('❌  Error al inicializar la base de datos:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };
