const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = 'SELECT * FROM materias';
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
    const row = db.prepare('SELECT * FROM materias WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { nombre, creditos, descripcion } = req.body;
    if (!nombre || creditos === undefined || !descripcion) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, creditos, descripcion' });
    }
    if (isNaN(creditos) || creditos < 1 || creditos > 10) {
      return res.status(400).json({ success: false, message: 'Los créditos deben ser un número entre 1 y 10' });
    }
    const existe = db.prepare('SELECT id FROM materias WHERE nombre = ?').get(nombre.trim());
    if (existe) return res.status(400).json({ success: false, message: 'Ya existe una materia con ese nombre' });
    const result = db.prepare('INSERT INTO materias (nombre, creditos, descripcion) VALUES (?, ?, ?)')
      .run(nombre.trim(), parseInt(creditos), descripcion.trim());
    res.status(201).json({ success: true, message: 'Materia creada', data: { id: result.lastInsertRowid } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, creditos, descripcion } = req.body;
    if (!nombre || creditos === undefined || !descripcion) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: nombre, creditos, descripcion' });
    }
    if (isNaN(creditos) || creditos < 1 || creditos > 10) {
      return res.status(400).json({ success: false, message: 'Los créditos deben ser un número entre 1 y 10' });
    }
    const existe = db.prepare('SELECT id FROM materias WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    const dup = db.prepare('SELECT id FROM materias WHERE nombre = ? AND id != ?').get(nombre.trim(), req.params.id);
    if (dup) return res.status(400).json({ success: false, message: 'Ya existe otra materia con ese nombre' });
    db.prepare('UPDATE materias SET nombre=?, creditos=?, descripcion=? WHERE id=?')
      .run(nombre.trim(), parseInt(creditos), descripcion.trim(), req.params.id);
    res.json({ success: true, message: 'Materia actualizada' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM materias WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Materia no encontrada' });
    db.prepare('DELETE FROM materias WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Materia eliminada' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
