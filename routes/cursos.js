const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
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
  db.all(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get('/:id', (req, res) => {
  const sql = `SELECT c.*, p.nombre AS nombre_profesor, m.nombre AS nombre_materia
               FROM cursos c
               JOIN profesores p ON c.profesor_id = p.id
               JOIN materias  m ON c.materia_id  = m.id
               WHERE c.id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
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
  // Verificar FK: profesor existe
  db.get('SELECT id FROM profesores WHERE id = ?', [profesor_id], (err, prof) => {
    if (err)   return res.status(500).json({ success: false, message: err.message });
    if (!prof) return res.status(404).json({ success: false, message: `No existe el profesor con id ${profesor_id}` });
    // Verificar FK: materia existe
    db.get('SELECT id FROM materias WHERE id = ?', [materia_id], (err, mat) => {
      if (err)  return res.status(500).json({ success: false, message: err.message });
      if (!mat) return res.status(404).json({ success: false, message: `No existe la materia con id ${materia_id}` });
      db.run(
        'INSERT INTO cursos (nombre, profesor_id, materia_id, anio, semestre) VALUES (?, ?, ?, ?, ?)',
        [nombre.trim(), parseInt(profesor_id), parseInt(materia_id), parseInt(anio), String(semestre)],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.status(201).json({ success: true, message: 'Curso creado', data: { id: this.lastID } });
        }
      );
    });
  });
});

router.put('/:id', (req, res) => {
  const { nombre, profesor_id, materia_id, anio, semestre } = req.body;
  if (!nombre || !profesor_id || !materia_id || !anio || !semestre) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, profesor_id, materia_id, anio, semestre' });
  }
  if (!['1', '2'].includes(String(semestre))) {
    return res.status(400).json({ success: false, message: 'El semestre debe ser "1" o "2"' });
  }
  db.get('SELECT id FROM cursos WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    db.get('SELECT id FROM profesores WHERE id = ?', [profesor_id], (err, prof) => {
      if (err)   return res.status(500).json({ success: false, message: err.message });
      if (!prof) return res.status(404).json({ success: false, message: `No existe el profesor con id ${profesor_id}` });
      db.get('SELECT id FROM materias WHERE id = ?', [materia_id], (err, mat) => {
        if (err)  return res.status(500).json({ success: false, message: err.message });
        if (!mat) return res.status(404).json({ success: false, message: `No existe la materia con id ${materia_id}` });
        db.run(
          'UPDATE cursos SET nombre=?, profesor_id=?, materia_id=?, anio=?, semestre=? WHERE id=?',
          [nombre.trim(), parseInt(profesor_id), parseInt(materia_id), parseInt(anio), String(semestre), req.params.id],
          function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Curso actualizado' });
          }
        );
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM cursos WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Curso no encontrado' });
    db.run('DELETE FROM cursos WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Curso eliminado' });
    });
  });
});

module.exports = router;
