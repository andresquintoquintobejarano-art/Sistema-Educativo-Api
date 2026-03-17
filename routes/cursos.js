const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = `SELECT c.*, p.nombre AS nombre_profesor, m.nombre AS nombre_materia
               FROM cursos c
               JOIN profesores p ON c.profesor_id = p.id
               JOIN materias  m ON c.materia_id  = m.id`;
    const vals = [];
    const condiciones = Object.entries(filtros).map(([campo, valor]) => {
      vals.push(`%${valor}%`); return `c.${campo} LIKE ?`;
    });
    if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
    const rows = db.prepare(sql).all(...vals);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT c.*, p.nombre AS nombre_profesor, m.nombre AS nombre_materia
                            FROM cursos c
                            JOIN profesores p ON c.profesor_id = p.id
                            JOIN materias  m ON c.materia_id  = m.id
                            WHERE c.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { nombre, profesor_id, materia_id, anio, semestre } = req.body;
    if (!nombre || !profesor_id || !materia_id || !anio || !semestre) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, profesor_id, materia_id, anio, semestre' });
    }
    if (isNaN(profesor_id) || isNaN(materia_id) || isNaN(anio)) {
      return res.status(400).json({ success: false, message: 'profesor_id, materia_id y anio deben ser números' });
    }
    if (!['1', '2'].includes(String(semestre))) {
      return res.status(400).json({ success: false, message: 'El semestre debe ser "1" o "2"' });
    }
    const prof = db.prepare('SELECT id FROM profesores WHERE id = ?').get(profesor_id);
    if (!prof) return res.status(404).json({ success: false, message: `No existe el profesor con id ${profesor_id}` });
    const mat = db.prepare('SELECT id FROM materias WHERE id = ?').get(materia_id);
    if (!mat) return res.status(404).json({ success: false, message: `No existe la materia con id ${materia_id}` });
    const result = db.prepare('INSERT INTO cursos (nombre, profesor_id, materia_id, anio, semestre) VALUES (?, ?, ?, ?, ?)')
      .run(nombre.trim(), parseInt(profesor_id), parseInt(materia_id), parseInt(anio), String(semestre));
    res.status(201).json({ success: true, message: 'Curso creado', data: { id: result.lastInsertRowid } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, profesor_id, materia_id, anio, semestre } = req.body;
    if (!nombre || !profesor_id || !materia_id || !anio || !semestre) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, profesor_id, materia_id, anio, semestre' });
    }
    if (!['1', '2'].includes(String(semestre))) {
      return res.status(400).json({ success: false, message: 'El semestre debe ser "1" o "2"' });
    }
    const existe = db.prepare('SELECT id FROM cursos WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    const prof = db.prepare('SELECT id FROM profesores WHERE id = ?').get(profesor_id);
    if (!prof) return res.status(404).json({ success: false, message: `No existe el profesor con id ${profesor_id}` });
    const mat = db.prepare('SELECT id FROM materias WHERE id = ?').get(materia_id);
    if (!mat) return res.status(404).json({ success: false, message: `No existe la materia con id ${materia_id}` });
    db.prepare('UPDATE cursos SET nombre=?, profesor_id=?, materia_id=?, anio=?, semestre=? WHERE id=?')
      .run(nombre.trim(), parseInt(profesor_id), parseInt(materia_id), parseInt(anio), String(semestre), req.params.id);
    res.json({ success: true, message: 'Curso actualizado' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM cursos WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    db.prepare('DELETE FROM cursos WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Curso eliminado' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
