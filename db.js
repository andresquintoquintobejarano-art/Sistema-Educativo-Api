const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS profesores (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL,
    email        TEXT    NOT NULL UNIQUE,
    documento    TEXT    NOT NULL UNIQUE,
    especialidad TEXT    NOT NULL,
    telefono     TEXT,
    created_at   TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS materias (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL UNIQUE,
    creditos    INTEGER NOT NULL CHECK(creditos >= 1 AND creditos <= 10),
    descripcion TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS estudiantes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre           TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    documento        TEXT NOT NULL UNIQUE,
    telefono         TEXT,
    fecha_nacimiento TEXT NOT NULL,
    created_at       TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    profesor_id INTEGER NOT NULL,
    materia_id  INTEGER NOT NULL,
    anio        INTEGER NOT NULL CHECK(anio >= 2000 AND anio <= 2100),
    semestre    TEXT    NOT NULL CHECK(semestre IN ('1', '2')),
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (profesor_id) REFERENCES profesores(id),
    FOREIGN KEY (materia_id)  REFERENCES materias(id)
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id     INTEGER NOT NULL,
    curso_id          INTEGER NOT NULL,
    fecha_inscripcion TEXT    NOT NULL,
    estado            TEXT    NOT NULL CHECK(estado IN ('activa', 'cancelada', 'finalizada')),
    created_at        TEXT    DEFAULT (datetime('now')),
    UNIQUE(estudiante_id, curso_id),
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (curso_id)      REFERENCES cursos(id)
  );

  CREATE TABLE IF NOT EXISTS notas (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    inscripcion_id INTEGER NOT NULL,
    nota           REAL    NOT NULL CHECK(nota >= 0.0 AND nota <= 5.0),
    tipo           TEXT    NOT NULL CHECK(tipo IN ('parcial', 'final', 'taller', 'quiz')),
    fecha          TEXT    NOT NULL,
    created_at     TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id)
  );

  CREATE TABLE IF NOT EXISTS horarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id    INTEGER NOT NULL,
    dia         TEXT    NOT NULL CHECK(dia IN ('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado')),
    hora_inicio TEXT    NOT NULL,
    hora_fin    TEXT    NOT NULL,
    salon       TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
  );
`);

console.log('Base de datos lista');

module.exports = db;