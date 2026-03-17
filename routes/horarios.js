const express = require('express');
const router  = express.Router();
const db      = require('../db');

const DIAS_VALIDOS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = `SELECT h.*, c.nombre AS nombre_curso
               FROM horarios h
               JOIN cursos c ON h.curso_id = c.id`;
    const vals = [];
    const condiciones = Object.entries(filtros).map(([campo, valor]) => {
      vals.push(`%${valor}%`); return `h.${campo} LIKE ?`;
    });
    if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
    const rows = db.prepare(sql).all(...vals);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM horarios WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { curso_id, dia, hora_inicio, hora_fin, salon } = req.body;
    if (!curso_id || !dia || !hora_inicio || !hora_fin || !salon) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: curso_id, dia, hora_inicio, hora_fin, salon' });
    }
    if (!DIAS_VALIDOS.includes(dia)) {
      return res.status(400).json({ success: false, message: `El día debe ser: ${DIAS_VALIDOS.join(', ')}` });
    }
    if (isNaN(curso_id)) {
      return res.status(400).json({ success: false, message: 'curso_id debe ser un número' });
    }
    const cur = db.prepare('SELECT id FROM cursos WHERE id = ?').get(curso_id);
    if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
    const result = db.prepare('INSERT INTO horarios (curso_id, dia, hora_inicio, hora_fin, salon) VALUES (?, ?, ?, ?, ?)')
      .run(parseInt(curso_id), dia, hora_inicio, hora_fin, salon.trim());
    res.status(201).json({ success: true, message: 'Horario creado', data: { id: result.lastInsertRowid } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { curso_id, dia, hora_inicio, hora_fin, salon } = req.body;
    if (!curso_id || !dia || !hora_inicio || !hora_fin || !salon) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: curso_id, dia, hora_inicio, hora_fin, salon' });
    }
    if (!DIAS_VALIDOS.includes(dia)) {
      return res.status(400).json({ success: false, message: `Día inválido. Usa: ${DIAS_VALIDOS.join(', ')}` });
    }
    const existe = db.prepare('SELECT id FROM horarios WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    const cur = db.prepare('SELECT id FROM cursos WHERE id = ?').get(curso_id);
    if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
    db.prepare('UPDATE horarios SET curso_id=?, dia=?, hora_inicio=?, hora_fin=?, salon=? WHERE id=?')
      .run(parseInt(curso_id), dia, hora_inicio, hora_fin, salon.trim(), req.params.id);
    res.json({ success: true, message: 'Horario actualizado' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM horarios WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Horario no encontrado' });
    db.prepare('DELETE FROM horarios WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Horario eliminado' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
