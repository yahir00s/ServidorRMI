const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');
const storage = require('../data/utils/storage');
const router = express.Router();

const NODO_PRINCIPAL = 'nodo1';
const NODOS_REPLICA = ['nodo2'];

// Obtener archivos
router.get('/', verifyToken, (req, res) => {
  try {
    const archivos = storage.read(NODO_PRINCIPAL, 'archivos') || [];
    res.json({
      archivos,
      metadata: {
        nodo: NODO_PRINCIPAL,
        total: archivos.length
      }
    });
  } catch (error) {
    // Si el nodo principal falla, intentar leer de réplica
    console.warn('⚠️ Nodo principal no disponible, leyendo de réplica...');
    try {
      const archivos = storage.read(NODOS_REPLICA[0], 'archivos') || [];
      res.json({
        archivos,
        metadata: {
          nodo: NODOS_REPLICA[0],
          advertencia: 'Leído desde réplica (nodo principal caído)'
        }
      });
    } catch (replicaError) {
      res.status(503).json({ 
        error: 'Todos los nodos están caídos',
        detalle: replicaError.message 
      });
    }
  }
});

// Crear archivo con replicación automática
router.post('/', verifyToken, (req, res) => {
  try {
    const { nombre, contenido, owner } = req.body;
    const archivos = storage.read(NODO_PRINCIPAL, 'archivos') || [];
    
    const nuevo = {
      id: uuidv4(),
      nombre,
      contenido: contenido || '',
      owner,
      version: 1,
      nodoId: NODO_PRINCIPAL,
      replicas: NODOS_REPLICA,
      createdAt: new Date().toISOString()
    };
    
    archivos.push(nuevo);
    
    // Escribir en nodo principal
    storage.write(NODO_PRINCIPAL, 'archivos', archivos);
    
    // Replicar automáticamente (asíncrono simulado)
    setTimeout(() => {
      NODOS_REPLICA.forEach(nodoReplica => {
        const resultado = storage.replicate(NODO_PRINCIPAL, nodoReplica, 'archivos');
        if (resultado.success) {
          console.log(`✅ Archivo ${nuevo.id} replicado en ${nodoReplica}`);
        } else {
          console.error(`❌ Fallo replicando en ${nodoReplica}: ${resultado.error}`);
        }
      });
    }, 100);
    
    res.status(201).json({
      archivo: nuevo,
      mensaje: `Archivo creado en ${NODO_PRINCIPAL}`,
      replicacion: `En proceso hacia: ${NODOS_REPLICA.join(', ')}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar archivo con control optimista
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { version, contenido } = req.body;
    const archivos = storage.read(NODO_PRINCIPAL, 'archivos') || [];
    const idx = archivos.findIndex(a => a.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Control optimista de concurrencia
    if (version !== archivos[idx].version) {
      return res.status(409).json({ 
        error: 'Conflicto de versión',
        currentVersion: archivos[idx].version,
        providedVersion: version,
        mensaje: 'Otro usuario modificó el archivo. Por favor, recarga y vuelve a intentar.'
      });
    }
    
    archivos[idx].contenido = contenido;
    archivos[idx].version += 1;
    archivos[idx].updatedAt = new Date().toISOString();
    
    // Guardar en nodo principal
    storage.write(NODO_PRINCIPAL, 'archivos', archivos);
    
    // Replicar cambio
    setTimeout(() => {
      NODOS_REPLICA.forEach(nodo => {
        storage.replicate(NODO_PRINCIPAL, nodo, 'archivos');
      });
    }, 50);
    
    res.json({
      archivo: archivos[idx],
      mensaje: 'Archivo actualizado y replicado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener archivo específico
router.get('/:id', verifyToken, (req, res) => {
  try {
    const archivos = storage.read(NODO_PRINCIPAL, 'archivos') || [];
    const archivo = archivos.find(a => a.id === req.params.id);
    
    if (!archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    res.json({
      archivo,
      metadata: { nodo: NODO_PRINCIPAL }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;