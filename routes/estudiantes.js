const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  let sql = 'SELECT * FROM estudiantes';
  const vals = [];
  const condiciones = Object.entries(filtros).map(([campo, valor]) => {
    vals.push(`%${valor}%`); return `${campo} LIKE ?`;
  });
  if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
  db.all(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM estudiantes WHERE id = ?', [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { nombre, email, documento, telefono, fecha_nacimiento } = req.body;
  if (!nombre || !email || !documento || !fecha_nacimiento) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, fecha_nacimiento' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'El email no tiene un formato válido' });
  }
  if (isNaN(Date.parse(fecha_nacimiento))) {
    return res.status(400).json({ success: false, message: 'La fecha de nacimiento no es válida. Usa formato YYYY-MM-DD' });
  }
  db.get('SELECT id FROM estudiantes WHERE email = ? OR documento = ?', [email, documento], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe un estudiante con ese email o documento' });
    db.run(
      'INSERT INTO estudiantes (nombre, email, documento, telefono, fecha_nacimiento) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), email.trim(), documento.trim(), telefono || null, fecha_nacimiento],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Estudiante creado', data: { id: this.lastID } });
      }
    );
  });
});

router.put('/:id', (req, res) => {
  const { nombre, email, documento, telefono, fecha_nacimiento } = req.body;
  if (!nombre || !email || !documento || !fecha_nacimiento) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, fecha_nacimiento' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Email inválido' });
  }
  if (isNaN(Date.parse(fecha_nacimiento))) {
    return res.status(400).json({ success: false, message: 'Fecha inválida. Usa YYYY-MM-DD' });
  }
  db.get('SELECT id FROM estudiantes WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    db.get('SELECT id FROM estudiantes WHERE (email=? OR documento=?) AND id!=?', [email, documento, req.params.id], (err, dup) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (dup) return res.status(400).json({ success: false, message: 'Otro estudiante ya usa ese email o documento' });
      db.run(
        'UPDATE estudiantes SET nombre=?, email=?, documento=?, telefono=?, fecha_nacimiento=? WHERE id=?',
        [nombre.trim(), email.trim(), documento.trim(), telefono || null, fecha_nacimiento, req.params.id],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Estudiante actualizado' });
        }
      );
    });
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM estudiantes WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    db.run('DELETE FROM estudiantes WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Estudiante eliminado' });
    });
  });
});

module.exports = router;
