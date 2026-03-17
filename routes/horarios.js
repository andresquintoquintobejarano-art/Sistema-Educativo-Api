const express = require('express');
const router  = express.Router();
const db      = require('../db');

const DIAS_VALIDOS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];

router.get('/', (req, res) => {
  const filtros = req.query;
  let sql = `SELECT h.*, c.nombre AS nombre_curso
             FROM horarios h
             JOIN cursos c ON h.curso_id = c.id`;
  const vals = [];
  const condiciones = Object.entries(filtros).map(([campo, valor]) => {
    vals.push(`%${valor}%`); return `h.${campo} LIKE ?`;
  });
  if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
  db.all(sql, vals, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, total: rows.length, data: rows });
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM horarios WHERE id = ?', [req.params.id], (err, row) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    res.json({ success: true, data: row });
  });
});

router.post('/', (req, res) => {
  const { curso_id, dia, hora_inicio, hora_fin, salon } = req.body;
  if (!curso_id || !dia || !hora_inicio || !hora_fin || !salon) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: curso_id, dia, hora_inicio, hora_fin, salon' });
  }
  if (!DIAS_VALIDOS.includes(dia)) {
    return res.status(400).json({ success: false, message: `El día debe ser uno de: ${DIAS_VALIDOS.join(', ')}` });
  }
  if (isNaN(curso_id)) {
    return res.status(400).json({ success: false, message: 'curso_id debe ser un número' });
  }
  // Verificar FK: curso existe
  db.get('SELECT id FROM cursos WHERE id = ?', [curso_id], (err, cur) => {
    if (err)  return res.status(500).json({ success: false, message: err.message });
    if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
    db.run(
      'INSERT INTO horarios (curso_id, dia, hora_inicio, hora_fin, salon) VALUES (?, ?, ?, ?, ?)',
      [parseInt(curso_id), dia, hora_inicio, hora_fin, salon.trim()],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Horario creado', data: { id: this.lastID } });
      }
    );
  });
});

router.put('/:id', (req, res) => {
  const { curso_id, dia, hora_inicio, hora_fin, salon } = req.body;
  if (!curso_id || !dia || !hora_inicio || !hora_fin || !salon) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios: curso_id, dia, hora_inicio, hora_fin, salon' });
  }
  if (!DIAS_VALIDOS.includes(dia)) {
    return res.status(400).json({ success: false, message: `Día inválido. Usa: ${DIAS_VALIDOS.join(', ')}` });
  }
  db.get('SELECT id FROM horarios WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    db.get('SELECT id FROM cursos WHERE id = ?', [curso_id], (err, cur) => {
      if (err)  return res.status(500).json({ success: false, message: err.message });
      if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
      db.run(
        'UPDATE horarios SET curso_id=?, dia=?, hora_inicio=?, hora_fin=?, salon=? WHERE id=?',
        [parseInt(curso_id), dia, hora_inicio, hora_fin, salon.trim(), req.params.id],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: err.message });
          res.json({ success: true, message: 'Horario actualizado' });
        }
      );
    });
  });
});

router.delete('/:id', (req, res) => {
  db.get('SELECT id FROM horarios WHERE id = ?', [req.params.id], (err, existe) => {
    if (err)    return res.status(500).json({ success: false, message: err.message });
    if (!existe) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    db.run('DELETE FROM horarios WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });
      res.json({ success: true, message: 'Horario eliminado' });
    });
  });
});

module.exports = router;
