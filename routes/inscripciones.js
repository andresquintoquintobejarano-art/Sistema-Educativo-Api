const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', (req, res) => {
  try {
    const filtros = req.query;
    let sql = `SELECT i.*, e.nombre AS nombre_estudiante, c.nombre AS nombre_curso
               FROM inscripciones i
               JOIN estudiantes e ON i.estudiante_id = e.id
               JOIN cursos      c ON i.curso_id      = c.id`;
    const vals = [];
    const condiciones = Object.entries(filtros).map(([campo, valor]) => {
      vals.push(`%${valor}%`); return `i.${campo} LIKE ?`;
    });
    if (condiciones.length) sql += ' WHERE ' + condiciones.join(' AND ');
    const rows = db.prepare(sql).all(...vals);
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT i.*, e.nombre AS nombre_estudiante, c.nombre AS nombre_curso
                            FROM inscripciones i
                            JOIN estudiantes e ON i.estudiante_id = e.id
                            JOIN cursos      c ON i.curso_id      = c.id
                            WHERE i.id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    res.json({ success: true, data: row });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const { estudiante_id, curso_id, fecha_inscripcion, estado } = req.body;
    if (!estudiante_id || !curso_id || !fecha_inscripcion || !estado) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: estudiante_id, curso_id, fecha_inscripcion, estado' });
    }
    if (!['activa', 'cancelada', 'finalizada'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado debe ser: activa, cancelada o finalizada' });
    }
    if (isNaN(Date.parse(fecha_inscripcion))) {
      return res.status(400).json({ success: false, message: 'Fecha inválida. Usa YYYY-MM-DD' });
    }
    const est = db.prepare('SELECT id FROM estudiantes WHERE id = ?').get(estudiante_id);
    if (!est) return res.status(404).json({ success: false, message: `No existe el estudiante con id ${estudiante_id}` });
    const cur = db.prepare('SELECT id FROM cursos WHERE id = ?').get(curso_id);
    if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
    const dup = db.prepare('SELECT id FROM inscripciones WHERE estudiante_id = ? AND curso_id = ?').get(estudiante_id, curso_id);
    if (dup) return res.status(400).json({ success: false, message: 'El estudiante ya está inscrito en ese curso' });
    const result = db.prepare('INSERT INTO inscripciones (estudiante_id, curso_id, fecha_inscripcion, estado) VALUES (?, ?, ?, ?)')
      .run(parseInt(estudiante_id), parseInt(curso_id), fecha_inscripcion, estado);
    res.status(201).json({ success: true, message: 'Inscripción creada', data: { id: result.lastInsertRowid } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { estudiante_id, curso_id, fecha_inscripcion, estado } = req.body;
    if (!estudiante_id || !curso_id || !fecha_inscripcion || !estado) {
      return res.status(400).json({ success: false, message: 'Campos obligatorios: estudiante_id, curso_id, fecha_inscripcion, estado' });
    }
    if (!['activa', 'cancelada', 'finalizada'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado inválido' });
    }
    const existe = db.prepare('SELECT id FROM inscripciones WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    const est = db.prepare('SELECT id FROM estudiantes WHERE id = ?').get(estudiante_id);
    if (!est) return res.status(404).json({ success: false, message: `No existe el estudiante con id ${estudiante_id}` });
    const cur = db.prepare('SELECT id FROM cursos WHERE id = ?').get(curso_id);
    if (!cur) return res.status(404).json({ success: false, message: `No existe el curso con id ${curso_id}` });
    db.prepare('UPDATE inscripciones SET estudiante_id=?, curso_id=?, fecha_inscripcion=?, estado=? WHERE id=?')
      .run(parseInt(estudiante_id), parseInt(curso_id), fecha_inscripcion, estado, req.params.id);
    res.json({ success: true, message: 'Inscripción actualizada' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    const existe = db.prepare('SELECT id FROM inscripciones WHERE id = ?').get(req.params.id);
    if (!existe) return res.status(404).json({ success: false, message: 'Inscripción no encontrada' });
    db.prepare('DELETE FROM inscripciones WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Inscripción eliminada' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
