const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = 'SELECT * FROM profesores';
    const vals = [];
    const condiciones = Object.entries(filtros).map(([campo, valor]) => {
      vals.push(`%${valor}%`);
      return `${campo} LIKE ?`;
    });
    if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
    const rows = db.prepare(sql).all(...vals);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM profesores WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { nombre, email, documento, especialidad, telefono } = req.body;
    if (!nombre || !email || !documento || !especialidad) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, especialidad' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }
    const existe = db.prepare('SELECT id FROM profesores WHERE email = ? OR documento = ?').get(email, documento);
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe un profesor con ese email o documento' });
    const result = db.prepare(
      'INSERT INTO profesores (nombre, email, documento, especialidad, telefono) VALUES (?, ?, ?, ?, ?)'
    ).run(nombre.trim(), email.trim(), documento.trim(), especialidad.trim(), telefono || null);
    res.status(201).json({ success: true, message: 'Profesor creado', data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, email, documento, especialidad, telefono } = req.body;
    if (!nombre || !email || !documento || !especialidad) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, especialidad' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }
    const existe = db.prepare('SELECT id FROM profesores WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    const dup = db.prepare('SELECT id FROM profesores WHERE (email = ? OR documento = ?) AND id != ?').get(email, documento, req.params.id);
    if (dup) return res.status(400).json({ success: false, message: 'Otro profesor ya usa ese email o documento' });
    db.prepare('UPDATE profesores SET nombre=?, email=?, documento=?, especialidad=?, telefono=? WHERE id=?')
      .run(nombre.trim(), email.trim(), documento.trim(), especialidad.trim(), telefono || null, req.params.id);
    res.json({ success: true, message: 'Profesor actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM profesores WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Profesor no encontrado' });
    db.prepare('DELETE FROM profesores WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Profesor eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;