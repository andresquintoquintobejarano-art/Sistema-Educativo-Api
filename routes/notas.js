const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  const filtros = req.query;
  let sql = `SELECT n.*, i.estado AS estado_inscripcion, e.nombre AS nombre_estudiante
             FROM notas n
             JOIN inscripciones i ON n.inscripcion_id = i.id
             JOIN estudiantes   e ON i.estudiante_id  = e.id`;
  const vals = [];
  const condiciones = Object.entries(filtros).map(([campo, valor]) => {
    vals.push(`%${valor}%`); return `n.${campo} LIKE ?`;
  });
  if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
  db.all(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM notas WHERE id = ?', [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
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
  // Verificar FK: inscripcion existe
  db.get('SELECT id FROM inscripciones WHERE id = ?', [inscripcion_id], (err, ins) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!ins) return res.status(404).json({ success: false, message: `No existe la inscripción con id ${inscripcion_id}` });
    db.run(
      'INSERT INTO notas (inscripcion_id, nota, tipo, fecha) VALUES (?, ?, ?, ?)',
      [parseInt(inscripcion_id), parseFloat(nota), tipo, fecha],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Nota creada', data: { id: this.lastID } });
      }
    );
  });
});

router.put('/:id', (req, res) => {
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
  db.get('SELECT id FROM notas WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    db.get('SELECT id FROM inscripciones WHERE id = ?', [inscripcion_id], (err, ins) => {
      if (err)  return res.status(500).json({ success: false, message: err.message });
      if (!ins) return res.status(404).json({ success: false, message: `No existe la inscripción con id ${inscripcion_id}` });
      db.run(
        'UPDATE notas SET inscripcion_id=?, nota=?, tipo=?, fecha=? WHERE id=?',
        [parseInt(inscripcion_id), parseFloat(nota), tipo, fecha, req.params.id],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Nota actualizada' });
        }
      );
    });
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM notas WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Nota no encontrada' });
    db.run('DELETE FROM notas WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Nota eliminada' });
    });
  });
});

module.exports = router;
