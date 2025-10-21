const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET } = require('../middleware/auth');
const router = express.Router();

let users = [
  // password hashed: 'admin123'
  { id: 'admin', username: 'admin', passwordHash: bcrypt.hashSync('admin123', 8), rol: 'admin' }
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const u = users.find(x => x.username === username);
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });
  if (!bcrypt.compareSync(password, u.passwordHash)) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ id: u.id, username: u.username, rol: u.rol }, SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Registrar (solo demo)
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const h = bcrypt.hashSync(password, 8);
  const newU = { id: `u${Date.now()}`, username, passwordHash: h, rol: 'user' };
  users.push(newU);
  res.status(201).json({ id: newU.id, username: newU.username });
});

module.exports = router;
