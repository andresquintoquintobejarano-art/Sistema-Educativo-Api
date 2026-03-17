const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /profesores?nombre=&especialidad=
router.get('/', (req, res) => {
  const filtros = req.query;
  let sql    = 'SELECT * FROM profesores';
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

// GET /profesores/:id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM profesores WHERE id = ?', [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    res.json({ success: true, data: row });
  });
});

// POST /profesores
router.post('/', (req, res) => {
  const { nombre, email, documento, especialidad, telefono } = req.body;

  if (!nombre || !email || !documento || !especialidad) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, especialidad' });
  }
  if (typeof nombre !== 'string' || nombre.trim() === '') {
    return res.status(400).json({ success: false, message: 'El nombre debe ser un texto válido' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'El email no tiene un formato válido' });
  }

  db.get('SELECT id FROM profesores WHERE email = ? OR documento = ?', [email, documento], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe un profesor con ese email o documento' });

    db.run(
      'INSERT INTO profesores (nombre, email, documento, especialidad, telefono) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), email.trim(), documento.trim(), especialidad.trim(), telefono || null],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Profesor creado', data: { id: this.lastID } });
      }
    );
  });
});

// PUT /profesores/:id
router.put('/:id', (req, res) => {
  const { nombre, email, documento, especialidad, telefono } = req.body;

  if (!nombre || !email || !documento || !especialidad) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, especialidad' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'El email no tiene un formato válido' });
  }

  db.get('SELECT id FROM profesores WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });

    db.get(
      'SELECT id FROM profesores WHERE (email = ? OR documento = ?) AND id != ?',
      [email, documento, req.params.id],
      (err, dup) => {
        if (err)  return res.status(500).json({ success: false, message: err.message });
        if (dup)  return res.status(400).json({ success: false, message: 'Otro profesor ya usa ese email o documento' });

        db.run(
          'UPDATE profesores SET nombre=?, email=?, documento=?, especialidad=?, telefono=? WHERE id=?',
          [nombre.trim(), email.trim(), documento.trim(), especialidad.trim(), telefono || null, req.params.id],
          function(err) {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: 'Profesor actualizado' });
          }
        );
      }
    );
  });
});

// DELETE /profesores/:id
router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM profesores WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });

    db.run('DELETE FROM profesores WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Profesor eliminado' });
    });
  });
});

module.exports = router;
