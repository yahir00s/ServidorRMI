const express = require('express');
const router = express.Router();
const nodos = require('./nodos'); // NOTE: en un sistema real usarías servicio; aquí solo ejemplo conceptual

// Simplificado: round-robin en memoria
let last = 0;
let nodosList = [
  { id: 'n1', host: '10.0.0.1', status: 'up' },
  { id: 'n2', host: '10.0.0.2', status: 'up' },
  { id: 'n3', host: '10.0.0.3', status: 'down' }
];

router.get('/asignar', (req, res) => {
  const up = nodosList.filter(n => n.status === 'up');
  if (up.length === 0) return res.status(503).json({ error: 'No hay nodos disponibles' });
  last = (last + 1) % up.length;
  res.json({ nodo: up[last] });
});

module.exports = router;
