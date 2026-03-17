const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  let sql = 'SELECT * FROM materias';
  const vals = [];
  const condiciones = Object.entries(filtros).map(([campo, valor]) => {
    vals.push(`%${valor}%`);
    return `${campo} LIKE ?`;
  });
  if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
  db.all(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM materias WHERE id = ?', [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { nombre, creditos, descripcion } = req.body;
  if (!nombre || creditos === undefined || !descripcion) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, creditos, descripcion' });
  }
  if (isNaN(creditos) || creditos < 1 || creditos > 10) {
    return res.status(400).json({ success: false, message: 'Los créditos deben ser un número entre 1 y 10' });
  }
  db.get('SELECT id FROM materias WHERE nombre = ?', [nombre.trim()], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe una materia con ese nombre' });
    db.run(
      'INSERT INTO materias (nombre, creditos, descripcion) VALUES (?, ?, ?)',
      [nombre.trim(), parseInt(creditos), descripcion.trim()],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Materia creada', data: { id: this.lastID } });
      }
    );
  });
});

router.put('/:id', (req, res) => {
  const { nombre, creditos, descripcion } = req.body;
  if (!nombre || creditos === undefined || !descripcion) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, creditos, descripcion' });
  }
  if (isNaN(creditos) || creditos < 1 || creditos > 10) {
    return res.status(400).json({ success: false, message: 'Los créditos deben ser un número entre 1 y 10' });
  }
  db.get('SELECT id FROM materias WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    db.get('SELECT id FROM materias WHERE nombre = ? AND id != ?', [nombre.trim(), req.params.id], (err, dup) => {
      if (err)  return res.status(500).json({ success: false, message: err.message });
      if (dup)  return res.status(400).json({ success: false, message: 'Ya existe otra materia con ese nombre' });
      db.run(
        'UPDATE materias SET nombre=?, creditos=?, descripcion=? WHERE id=?',
        [nombre.trim(), parseInt(creditos), descripcion.trim(), req.params.id],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Materia actualizada' });
        }
      );
    });
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM materias WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    db.run('DELETE FROM materias WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Materia eliminada' });
    });
  });
});

module.exports = router;
