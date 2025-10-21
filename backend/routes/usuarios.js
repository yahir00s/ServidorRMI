const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');
const storage = require('../data/utils/storage');
const router = express.Router();

// NODO PRINCIPAL: nodo1
const NODO_PRINCIPAL = 'nodo1';
const NODO_REPLICA = 'nodo2';

// Obtener todos los usuarios (lee del nodo principal)
router.get('/', verifyToken, (req, res) => {
  try {
    const usuarios = storage.read(NODO_PRINCIPAL, 'usuarios') || [];
    res.json({
      usuarios,
      metadata: {
        nodo: NODO_PRINCIPAL,
        total: usuarios.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al leer usuarios', 
      detalle: error.message 
    });
  }
});

// Obtener usuario por ID
router.get('/:id', verifyToken, (req, res) => {
  try {
    const usuarios = storage.read(NODO_PRINCIPAL, 'usuarios') || [];
    const usuario = usuarios.find(u => u.id === req.params.id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      usuario,
      metadata: { nodo: NODO_PRINCIPAL }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario (escribe en nodo principal)
router.post('/', verifyToken, (req, res) => {
  try {
    const { nombre, email, rol } = req.body;
    const usuarios = storage.read(NODO_PRINCIPAL, 'usuarios') || [];
    
    const nuevo = { 
      id: uuidv4(), 
      nombre, 
      email, 
      rol: rol || 'user',
      createdAt: new Date().toISOString(),
      nodoCreacion: NODO_PRINCIPAL
    };
    
    usuarios.push(nuevo);
    storage.write(NODO_PRINCIPAL, 'usuarios', usuarios);
    
    // Registrar en auditoría
    logAuditoria('usuario_creado', { id: nuevo.id, email: nuevo.email });
    
    res.status(201).json({
      usuario: nuevo,
      mensaje: `Usuario creado en ${NODO_PRINCIPAL}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar usuario
router.put('/:id', verifyToken, (req, res) => {
  try {
    const usuarios = storage.read(NODO_PRINCIPAL, 'usuarios') || [];
    const idx = usuarios.findIndex(u => u.id === req.params.id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    usuarios[idx] = { 
      ...usuarios[idx], 
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    storage.write(NODO_PRINCIPAL, 'usuarios', usuarios);
    
    res.json({
      usuario: usuarios[idx],
      mensaje: 'Usuario actualizado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario
router.delete('/:id', verifyToken, (req, res) => {
  try {
    let usuarios = storage.read(NODO_PRINCIPAL, 'usuarios') || [];
    const inicial = usuarios.length;
    
    usuarios = usuarios.filter(u => u.id !== req.params.id);
    
    if (usuarios.length === inicial) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    storage.write(NODO_PRINCIPAL, 'usuarios', usuarios);
    
    res.json({ 
      ok: true, 
      mensaje: 'Usuario eliminado' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: registrar auditoría
function logAuditoria(accion, detalle) {
  try {
    const logs = storage.read(NODO_REPLICA, 'logs') || [];
    logs.push({
      id: logs.length + 1,
      origen: 'usuarios_service',
      accion,
      detalle,
      timestamp: new Date().toISOString()
    });
    storage.write(NODO_REPLICA, 'logs', logs);
  } catch (error) {
    console.error('Error registrando auditoría:', error.message);
  }
}

module.exports = router;