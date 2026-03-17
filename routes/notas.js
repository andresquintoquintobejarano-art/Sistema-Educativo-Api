const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = `SELECT n.*, e.nombre AS nombre_estudiante, i.estado AS estado_inscripcion
               FROM notas n
               JOIN inscripciones i ON n.inscripcion_id = i.id
               JOIN estudiantes   e ON i.estudiante_id  = e.id`;
    const vals = [];
    const condiciones = Object.entries(filtros).map(([campo, valor]) => {
      vals.push(`%${valor}%`); return `n.${campo} LIKE ?`;
    });
    if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
    const rows = db.prepare(sql).all(...vals);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM notas WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { inscripcion_id, nota, tipo, fecha } = req.body;
    if (!inscripcion_id || nota === undefined || !tipo || !fecha) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: inscripcion_id, nota, tipo, fecha' });
    }
    if (isNaN(nota) || nota < 0.0 || nota > 5.0) {
      return res.status(400).json({ success: false, message: 'La nota debe ser un número entre 0.0 y 5.0' });
    }
    if (!['parcial', 'final', 'taller', 'quiz'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'El tipo debe ser: parcial, final, taller o quiz' });
    }
    if (isNaN(Date.parse(fecha))) {
      return res.status(400).json({ success: false, message: 'Fecha inválida. Usa YYYY-MM-DD' });
    }
    const ins = db.prepare('SELECT id FROM inscripciones WHERE id = ?').get(inscripcion_id);
    if (!ins) return res.status(404).json({ success: false, message: `No existe la inscripción con id ${inscripcion_id}` });
    const result = db.prepare('INSERT INTO notas (inscripcion_id, nota, tipo, fecha) VALUES (?, ?, ?, ?)')
      .run(parseInt(inscripcion_id), parseFloat(nota), tipo, fecha);
    res.status(201).json({ success: true, message: 'Nota creada', data: { id: result.lastInsertRowid } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { inscripcion_id, nota, tipo, fecha } = req.body;
    if (!inscripcion_id || nota === undefined || !tipo || !fecha) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: inscripcion_id, nota, tipo, fecha' });
    }
    if (isNaN(nota) || nota < 0.0 || nota > 5.0) {
      return res.status(400).json({ success: false, message: 'La nota debe ser entre 0.0 y 5.0' });
    }
    if (!['parcial', 'final', 'taller', 'quiz'].includes(tipo)) {
      return res.status(400).json({ success: false, message: 'Tipo inválido: parcial, final, taller, quiz' });
    }
    const existe = db.prepare('SELECT id FROM notas WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    const ins = db.prepare('SELECT id FROM inscripciones WHERE id = ?').get(inscripcion_id);
    if (!ins) return res.status(404).json({ success: false, message: `No existe la inscripción con id ${inscripcion_id}` });
    db.prepare('UPDATE notas SET inscripcion_id=?, nota=?, tipo=?, fecha=? WHERE id=?')
      .run(parseInt(inscripcion_id), parseFloat(nota), tipo, fecha, req.params.id);
    res.json({ success: true, message: 'Nota actualizada' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM notas WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    db.prepare('DELETE FROM notas WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Nota eliminada' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
