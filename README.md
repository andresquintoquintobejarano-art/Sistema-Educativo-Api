# Sistema Educativo API

## Descripción del proyecto
API REST para gestión de una institución educativa. Permite administrar estudiantes, profesores, materias, cursos, inscripciones, notas y horarios. Construida con Node.js, Express y SQLite.

## URL en producción
```
https://sistema-educativo-api.onrender.com
```

## Autenticación
Todas las rutas requieren el siguiente header en cada petición:
```
password: Sena2024Educativo
```

## Tecnologías utilizadas
- Node.js
- Express.js
- SQLite3
- dotenv
- Render (despliegue)

## Instrucciones para correr localmente
```bash
git clone https://github.com/tu-usuario/sistema-educativo-api.git
cd sistema-educativo-api
npm install
# Crea el archivo .env con: PORT=3000 y API_PASSWORD=Sena2024Educativo
npm run dev
```

## Endpoints

### Profesores `/profesores`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /profesores | Listar todos (filtros: ?nombre=&especialidad=) |
| GET | /profesores/:id | Obtener uno |
| POST | /profesores | Crear (nombre, email, documento, especialidad) |
| PUT | /profesores/:id | Actualizar |
| DELETE | /profesores/:id | Eliminar |

### Materias `/materias`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /materias | Listar todas (filtros: ?nombre=&creditos=) |
| GET | /materias/:id | Obtener una |
| POST | /materias | Crear (nombre, creditos 1-10, descripcion) |
| PUT | /materias/:id | Actualizar |
| DELETE | /materias/:id | Eliminar |

### Estudiantes `/estudiantes`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /estudiantes | Listar todos (filtros: ?nombre=&documento=) |
| GET | /estudiantes/:id | Obtener uno |
| POST | /estudiantes | Crear (nombre, email, documento, fecha_nacimiento) |
| PUT | /estudiantes/:id | Actualizar |
| DELETE | /estudiantes/:id | Eliminar |

### Cursos `/cursos`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /cursos | Listar todos (incluye nombre_profesor y nombre_materia) |
| GET | /cursos/:id | Obtener uno |
| POST | /cursos | Crear (nombre, profesor_id, materia_id, anio, semestre) |
| PUT | /cursos/:id | Actualizar |
| DELETE | /cursos/:id | Eliminar |

### Inscripciones `/inscripciones`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /inscripciones | Listar todas (incluye nombre_estudiante y nombre_curso) |
| GET | /inscripciones/:id | Obtener una |
| POST | /inscripciones | Crear (estudiante_id, curso_id, fecha_inscripcion, estado) |
| PUT | /inscripciones/:id | Actualizar |
| DELETE | /inscripciones/:id | Eliminar |

### Notas `/notas`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /notas | Listar todas (incluye nombre_estudiante) |
| GET | /notas/:id | Obtener una |
| POST | /notas | Crear (inscripcion_id, nota 0-5, tipo, fecha) |
| PUT | /notas/:id | Actualizar |
| DELETE | /notas/:id | Eliminar |

### Horarios `/horarios`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /horarios | Listar todos (incluye nombre_curso) |
| GET | /horarios/:id | Obtener uno |
| POST | /horarios | Crear (curso_id, dia, hora_inicio, hora_fin, salon) |
| PUT | /horarios/:id | Actualizar |
| DELETE | /horarios/:id | Eliminar |

## Validaciones implementadas
- Email con formato válido en estudiantes y profesores
- Documento y email únicos (no se repiten)
- Créditos entre 1 y 10 en materias
- Semestre solo puede ser "1" o "2"
- Nota entre 0.0 y 5.0
- Tipo de nota: parcial, final, taller, quiz
- Estado de inscripción: activa, cancelada, finalizada
- Día de horario: Lunes a Sabado
- Verificación de existencia de FK antes de crear registros dependientes
- Un estudiante no puede inscribirse dos veces al mismo curso
