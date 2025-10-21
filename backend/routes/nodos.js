const express = require('express');
const { v4: uuidv4 } = require('uuid');
const storage = require('../data/utils/storage');
const router = express.Router();

// Listar todos los nodos
router.get('/', (req, res) => {
  try {
    const nodos = storage.read('sistema', 'nodos') || [];
    
    // Agregar metadata de cada nodo
    const nodosConInfo = nodos.map(n => {
      const metadata = storage.getNodeMetadata(n.id);
      return { ...n, ...metadata };
    });
    
    res.json({
      nodos: nodosConInfo,
      total: nodosConInfo.length,
      activos: nodosConInfo.filter(n => n.status === 'up').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo nodo
router.post('/', (req, res) => {
  try {
    const nodos = storage.read('sistema', 'nodos') || [];
    
    const nuevo = {
      id: `n${nodos.length + 1}`,
      host: req.body.host || `10.0.0.${nodos.length + 1}`,
      status: 'up',
      tipo: req.body.tipo || 'replica'
    };
    
    nodos.push(nuevo);
    storage.write('sistema', 'nodos', nodos);
    
    // Crear directorio y metadata para el nuevo nodo
    const fs = require('fs');
    const path = require('path');
    const nodePath = path.join(__dirname, '../data', nuevo.id);
    
    if (!fs.existsSync(nodePath)) {
      fs.mkdirSync(nodePath, { recursive: true });
    }
    
    storage.updateMetadata(nuevo.id, {
      nodoId: nuevo.id,
      host: nuevo.host,
      status: 'up',
      tipo: nuevo.tipo,
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({
      nodo: nuevo,
      mensaje: `Nodo ${nuevo.id} creado y listo para operar`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simular caída de nodo
router.post('/:id/simular-caida', (req, res) => {
  try {
    const nodoId = req.params.id;
    
    storage.simulateNodeFailure(nodoId);
    
    console.log(`🔴 Nodo ${nodoId} ha caído`);
    console.log(`⚙️ Iniciando procedimientos de recuperación...`);
    
    // Simular migración de responsabilidades
    const nodos = storage.read('sistema', 'nodos');
    const nodosActivos = nodos.filter(n => n.status === 'up' && n.id !== nodoId);
    
    res.json({
      mensaje: `Nodo ${nodoId} marcado como caído`,
      accion: 'Migración de datos a réplicas',
      nodosAlternativos: nodosActivos.map(n => n.id),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recuperar nodo
router.post('/:id/recuperar', (req, res) => {
  try {
    const nodoId = req.params.id;
    
    storage.recoverNode(nodoId);
    
    console.log(`🟢 Nodo ${nodoId} recuperado`);
    console.log(`🔄 Sincronizando datos...`);
    
    // Simular sincronización desde réplica
    setTimeout(() => {
      try {
        // Ejemplo: sincronizar archivos desde nodo2 a nodo1
        if (nodoId === 'nodo1') {
          storage.replicate('nodo2', 'nodo1', 'archivos');
          console.log('✅ Sincronización completada');
        }
      } catch (syncError) {
        console.error('Error en sincronización:', syncError.message);
      }
    }, 500);
    
    res.json({
      mensaje: `Nodo ${nodoId} operativo nuevamente`,
      accion: 'Sincronización de datos en proceso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar status manualmente
router.put('/:id/status', (req, res) => {
  try {
    const nodos = storage.read('sistema', 'nodos');
    const nodo = nodos.find(n => n.id === req.params.id);
    
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    
    nodo.status = req.body.status || nodo.status;
    storage.write('sistema', 'nodos', nodos);
    storage.updateMetadata(req.params.id, { status: nodo.status });
    
    res.json({
      nodo,
      mensaje: `Status actualizado a: ${nodo.status}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener metadata de un nodo
router.get('/:id/metadata', (req, res) => {
  try {
    const metadata = storage.getNodeMetadata(req.params.id);
    
    if (!metadata) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;