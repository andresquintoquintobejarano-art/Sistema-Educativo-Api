require('dotenv').config();

const verificarPassword = (req, res, next) => {
  const password = req.headers['password'];

  if (!password || password !== process.env.API_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Envía el header: password'
    });
  }

  next();
};

module.exports = verificarPassword;