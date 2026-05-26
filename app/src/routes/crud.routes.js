const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');

const PAGE_SIZE = 5; // tareas por página

// ─── GET / — Listar con búsqueda, filtro y paginación ────────────────────────
router.get('/', async (req, res) => {
  try {
    const search    = (req.query.search   || '').trim();
    const filter    = req.query.filter    || 'all';     // all | pending | done
    const priority  = req.query.priority  || 'all';     // all | alta | media | baja
    const page      = Math.max(1, parseInt(req.query.page) || 1);
    const offset    = (page - 1) * PAGE_SIZE;

    // Construir WHERE dinámico
    const conditions = [];
    const params     = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }
    if (filter === 'pending') conditions.push('completed = FALSE');
    if (filter === 'done')    conditions.push('completed = TRUE');
    if (priority !== 'all') {
      params.push(priority);
      conditions.push(`priority = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total para paginación
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM tasks ${where}`, params
    );
    const total     = parseInt(count);
    const totalPages = Math.ceil(total / PAGE_SIZE);

    // Tareas de la página actual
    const { rows: tasks } = await pool.query(
      `SELECT * FROM tasks ${where}
       ORDER BY
         CASE priority WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
         created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, PAGE_SIZE, offset]
    );

    res.render('index', {
      tasks, editTask: null,
      search, filter, priority,
      page, totalPages, total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las tareas.');
  }
});

// ─── POST /create ─────────────────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  const { title, priority, deadline } = req.body;
  if (!title || !title.trim()) return res.redirect(303, '/');
  try {
    await pool.query(
      'INSERT INTO tasks (title, priority, deadline) VALUES ($1, $2, $3)',
      [title.trim(), priority || 'media', deadline || null]
    );
    res.redirect(303, '/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear la tarea.');
  }
});

// ─── GET /edit/:id ────────────────────────────────────────────────────────────
router.get('/edit/:id', async (req, res) => {
  try {
    const { rows: tasks }      = await pool.query(
      `SELECT * FROM tasks ORDER BY
         CASE priority WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,
         created_at DESC`
    );
    const { rows: [editTask] } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1', [req.params.id]
    );
    if (!editTask) return res.redirect(303, '/');
    res.render('index', {
      tasks, editTask,
      search: '', filter: 'all', priority: 'all',
      page: 1, totalPages: 1, total: tasks.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar la tarea.');
  }
});

// ─── POST /update/:id ─────────────────────────────────────────────────────────
router.post('/update/:id', async (req, res) => {
  const { title, completed, priority, deadline } = req.body;
  try {
    await pool.query(
      'UPDATE tasks SET title=$1, completed=$2, priority=$3, deadline=$4 WHERE id=$5',
      [title.trim(), completed === 'on', priority || 'media', deadline || null, req.params.id]
    );
    res.redirect(303, '/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar la tarea.');
  }
});

// ─── POST /delete/:id ─────────────────────────────────────────────────────────
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
