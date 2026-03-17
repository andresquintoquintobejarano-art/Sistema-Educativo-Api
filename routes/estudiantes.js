const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = 'SELECT * FROM estudiantes';
    const vals = [];
    const condiciones = Object.entries(filtros).map(([campo, valor]) => {
      vals.push(`%${valor}%`); return `${campo} LIKE ?`;
    });
    if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
    const rows = db.prepare(sql).all(...vals);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM estudiantes WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { nombre, email, documento, telefono, fecha_nacimiento } = req.body;
    if (!nombre || !email || !documento || !fecha_nacimiento) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, email, documento, fecha_nacimiento' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'El email no tiene un formato válido' });
    }
    if (isNaN(Date.parse(fecha_nacimiento))) {
      return res.status(400).json({ success: false, message: 'Fecha inválida. Usa YYYY-MM-DD' });
    }
    const existe = db.prepare('SELECT id FROM estudiantes WHERE email = ? OR documento = ?').get(email, documento);
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe un estudiante con ese email o documento' });
    const result = db.prepare('INSERT INTO estudiantes (nombre, email, documento, telefono, fecha_nacimiento) VALUES (?, ?, ?, ?, ?)')
      .run(nombre.trim(), email.trim(), documento.trim(), telefono || null, fecha_nacimiento);
    res.status(201).json({ success: true, message: 'Estudiante creado', data: { id: result.lastInsertRowid } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
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
    const existe = db.prepare('SELECT id FROM estudiantes WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    const dup = db.prepare('SELECT id FROM estudiantes WHERE (email = ? OR documento = ?) AND id != ?').get(email, documento, req.params.id);
    if (dup) return res.status(400).json({ success: false, message: 'Otro estudiante ya usa ese email o documento' });
    db.prepare('UPDATE estudiantes SET nombre=?, email=?, documento=?, telefono=?, fecha_nacimiento=? WHERE id=?')
      .run(nombre.trim(), email.trim(), documento.trim(), telefono || null, fecha_nacimiento, req.params.id);
    res.json({ success: true, message: 'Estudiante actualizado' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM estudiantes WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    db.prepare('DELETE FROM estudiantes WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Estudiante eliminado' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
