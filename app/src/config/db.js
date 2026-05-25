const { Pool } = require('pg');

// Pool de conexiones usando la variable de entorno inyectada por Docker Compose
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Script de inicialización: crea la tabla si no existe al arrancar el contenedor
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id        SERIAL PRIMARY KEY,
      title     VARCHAR(255) NOT NULL,
      completed BOOLEAN      NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('✅  Tabla "tasks" lista.');
  } catch (err) {
    console.error('❌  Error al inicializar la base de datos:', err.message);
    process.exit(1); // Detiene el contenedor si la DB falla al inicio
  }
};

module.exports = { pool, initDB };
