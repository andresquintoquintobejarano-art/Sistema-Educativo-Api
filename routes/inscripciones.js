const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  let sql = `SELECT i.*, e.nombre AS nombre_estudiante, c.nombre AS nombre_curso
             FROM inscripciones i
             JOIN estudiantes e ON i.estudiante_id = e.id
             JOIN cursos      c ON i.curso_id      = c.id`;
  const vals = [];
  const condiciones = Object.entries(filtros).map(([campo, valor]) => {
    vals.push(`%${valor}%`); return `i.${campo} LIKE ?`;
  });
  if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
  db.all(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get('/:id', (req, res) => {
  const sql = `SELECT i.*, e.nombre AS nombre_estudiante, c.nombre AS nombre_curso
               FROM inscripciones i
               JOIN estudiantes e ON i.estudiante_id = e.id
               JOIN cursos      c ON i.curso_id      = c.id
               WHERE i.id = ?`;
  db.get(sql, [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { estudiante_id, curso_id, fecha_inscripcion, estado } = req.body;
  if (!estudiante_id || !curso_id || !fecha_inscripcion || !estado) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: estudiante_id, curso_id, fecha_inscripcion, estado' });
  }
  if (!['activa', 'cancelada', 'finalizada'].includes(estado)) {
    return res.status(400).json({ success: false, message: 'El estado debe ser: activa, cancelada o finalizada' });
  }
  if (isNaN(Date.parse(fecha_inscripcion))) {
    return res.status(400).json({ success: false, message: 'Fecha inválida. Usa YYYY-MM-DD' });
  }
  // Verificar FK: estudiante existe
  db.get('SELECT id FROM estudiantes WHERE id = ?', [estudiante_id], (err, est) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!est) return res.status(404).json({ success: false, message: `No existe el estudiante con id ${estudiante_id}` });
    // Verificar FK: curso existe
    db.get('SELECT id FROM cursos WHERE id = ?', [curso_id], (err, cur) => {
      if (err)  return res.status(500).json({ success: false, message: err.message });
      if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
      // Verificar unicidad: un estudiante no puede inscribirse dos veces al mismo curso
      db.get('SELECT id FROM inscripciones WHERE estudiante_id=? AND curso_id=?', [estudiante_id, curso_id], (err, dup) => {
        if (err)  return res.status(500).json({ success: false, message: err.message });
        if (dup)  return res.status(400).json({ success: false, message: 'El estudiante ya está inscrito en ese curso' });
        db.run(
          'INSERT INTO inscripciones (estudiante_id, curso_id, fecha_inscripcion, estado) VALUES (?, ?, ?, ?)',
          [parseInt(estudiante_id), parseInt(curso_id), fecha_inscripcion, estado],
          function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.status(201).json({ success: true, message: 'Inscripción creada', data: { id: this.lastID } });
          }
        );
      });
    });
  });
});

router.put('/:id', (req, res) => {
  const { estudiante_id, curso_id, fecha_inscripcion, estado } = req.body;
  if (!estudiante_id || !curso_id || !fecha_inscripcion || !estado) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: estudiante_id, curso_id, fecha_inscripcion, estado' });
  }
  if (!['activa', 'cancelada', 'finalizada'].includes(estado)) {
    return res.status(400).json({ success: false, message: 'Estado inválido' });
  }
  db.get('SELECT id FROM inscripciones WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    db.get('SELECT id FROM estudiantes WHERE id = ?', [estudiante_id], (err, est) => {
      if (err)  return res.status(500).json({ success: false, message: err.message });
      if (!est) return res.status(404).json({ success: false, message: `No existe el estudiante con id ${estudiante_id}` });
      db.get('SELECT id FROM cursos WHERE id = ?', [curso_id], (err, cur) => {
        if (err)  return res.status(500).json({ success: false, message: err.message });
        if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
        db.run(
          'UPDATE inscripciones SET estudiante_id=?, curso_id=?, fecha_inscripcion=?, estado=? WHERE id=?',
          [parseInt(estudiante_id), parseInt(curso_id), fecha_inscripcion, estado, req.params.id],
          function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Inscripción actualizada' });
          }
        );
      });
    });
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM inscripciones WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    db.run('DELETE FROM inscripciones WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Inscripción eliminada' });
    });
  });
});

module.exports = router;
