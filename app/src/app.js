const express = require('express');
const path    = require('path');
const { initDB } = require('./config/db');
const crudRoutes = require('./routes/crud.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true })); // Parsear datos de formularios HTML
app.use(express.json());                         // Parsear JSON (útil para extensiones futuras)

// ── Motor de plantillas EJS ──────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use('/', crudRoutes);

// ── Arranque del servidor ────────────────────────────────────────────────────
const start = async () => {
  await initDB();                                // Crea la tabla si no existe
  app.listen(PORT, () => {
    console.log(`🚀  App corriendo en http://localhost:${PORT}`);
  });
};

start();
