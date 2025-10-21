const express = require('express');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Logs in-memory
let logs = [];

router.post('/log', verifyToken, (req, res) => {
  const { origen, accion, detalle } = req.body;
  logs.push({ id: logs.length + 1, origen, accion, detalle, ts: new Date() });
  res.json({ ok: true });
});

router.get('/logs', verifyToken, (req, res) => res.json(logs));

module.exports = router;
