require('dotenv').config();
const express           = require('express');
const verificarPassword = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(verificarPassword);

// Rutas
app.use('/profesores',    require('./routes/profesores'));
app.use('/materias',      require('./routes/materias'));
app.use('/estudiantes',   require('./routes/estudiantes'));
app.use('/cursos',        require('./routes/cursos'));
app.use('/inscripciones', require('./routes/inscripciones'));
app.use('/notas',         require('./routes/notas'));
app.use('/horarios',      require('./routes/horarios'));

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema Educativo - SENA',
    endpoints: ['/profesores', '/materias', '/estudiantes', '/cursos', '/inscripciones', '/notas', '/horarios']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});