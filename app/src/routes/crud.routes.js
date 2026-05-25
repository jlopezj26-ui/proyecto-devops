const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');
 
// ─── GET / — Listar todas las tareas ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows: tasks } = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.render('index', { tasks, editTask: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las tareas.');
  }
});
 
// ─── POST /create — Crear nueva tarea ────────────────────────────────────────
router.post('/create', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) return res.redirect(303, '/');
  try {
    await pool.query('INSERT INTO tasks (title) VALUES ($1)', [title.trim()]);
    res.redirect(303, '/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear la tarea.');
  }
});
 
// ─── GET /edit/:id — Cargar formulario de edición ────────────────────────────
router.get('/edit/:id', async (req, res) => {
  try {
    const { rows: tasks }    = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    const { rows: [editTask] } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!editTask) return res.redirect(303, '/');
    res.render('index', { tasks, editTask });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar la tarea.');
  }
});
 
// ─── POST /update/:id — Guardar cambios ──────────────────────────────────────
router.post('/update/:id', async (req, res) => {
  const { title, completed } = req.body;
  try {
    await pool.query(
      'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3',
      [title.trim(), completed === 'on', req.params.id]
    );
    res.redirect(303, '/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar la tarea.');
  }
});
 
// ─── POST /delete/:id — Eliminar tarea ───────────────────────────────────────
router.post('/delete/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.redirect(303, '/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar la tarea.');
  }
});
 
module.exports = router;