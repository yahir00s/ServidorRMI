const express = require('express');
const cors = require('cors');

const usuariosRouter = require('./routes/usuarios');
const archivosRouter = require('./routes/archivos');
const auditorRouter = require('./routes/auditor');
const nodosRouter = require('./routes/nodos');
const seguridadRouter = require('./routes/seguridad');
const balanceadorRouter = require('./routes/balanceador');

const app = express();
app.use(cors());
app.use(express.json());

// Routers (simulan interfaces remotas / endpoints)
app.use('/api/usuarios', usuariosRouter);
app.use('/api/archivos', archivosRouter);
app.use('/api/auditor', auditorRouter);
app.use('/api/nodos', nodosRouter);
app.use('/api/seguridad', seguridadRouter);
app.use('/api/balanceador', balanceadorRouter);

// Simulación de estado del sistema (health)
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
