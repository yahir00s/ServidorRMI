const jwt = require('jsonwebtoken');
const SECRET = 'mi_secreto_actividad_oo_2025';

function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  jwt.verify(token, SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    req.user = payload;
    next();
  });
}
module.exports = { verifyToken, SECRET };
