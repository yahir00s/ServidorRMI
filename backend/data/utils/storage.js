const fs = require('fs');
const path = require('path');

class DistributedStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      'data/nodo1',
      'data/nodo2', 
      'data/nodo3',
      'data/sistema'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Inicializar archivos si no existen
    this.initializeFiles();
  }

  initializeFiles() {
    const initialData = {
      'nodo1/usuarios.json': [],
      'nodo1/archivos.json': [],
      'nodo1/metadata.json': { nodoId: 'n1', host: '10.0.0.1', status: 'up', tipo: 'principal', lastSync: new Date().toISOString() },
      'nodo2/archivos.json': [],
      'nodo2/logs.json': [],
      'nodo2/metadata.json': { nodoId: 'n2', host: '10.0.0.2', status: 'up', tipo: 'replica', lastSync: new Date().toISOString() },
      'nodo3/metadata.json': { nodoId: 'n3', host: '10.0.0.3', status: 'up', tipo: 'analisis', lastSync: new Date().toISOString() },
      'sistema/nodos.json': [
        { id: 'n1', host: '10.0.0.1', status: 'up', tipo: 'principal' },
        { id: 'n2', host: '10.0.0.2', status: 'up', tipo: 'replica' },
        { id: 'n3', host: '10.0.0.3', status: 'up', tipo: 'analisis' }
      ],
      'sistema/usuarios_auth.json': []
    };

    Object.keys(initialData).forEach(file => {
      const filePath = path.join(this.dataDir, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData[file], null, 2));
      }
    });
  }

  // Leer datos de un nodo específico
  read(nodo, archivo) {
    try {
      const filePath = path.join(this.dataDir, nodo, `${archivo}.json`);
      
      // Simular latencia de red
      this.simulateNetworkLatency();
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Archivo no encontrado en ${nodo}/${archivo}.json`);
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      console.log(`📖 Lectura de ${nodo}/${archivo}.json`);
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error leyendo ${nodo}/${archivo}:`, error.message);
      throw new Error(`Fallo al leer del nodo ${nodo}`);
    }
  }

  // Escribir datos en un nodo específico
  write(nodo, archivo, data) {
    try {
      const filePath = path.join(this.dataDir, nodo, `${archivo}.json`);
      
      // Simular latencia de escritura
      this.simulateNetworkLatency();
      
      // Verificar si el nodo está disponible
      const metadata = this.getNodeMetadata(nodo);
      if (metadata && metadata.status === 'down') {
        throw new Error(`Nodo ${nodo} no está disponible`);
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✍️ Escritura en ${nodo}/${archivo}.json (${data.length || 'N/A'} registros)`);
      
      // Actualizar timestamp de última modificación
      this.updateMetadata(nodo, { lastSync: new Date().toISOString() });
      
      return true;
    } catch (error) {
      console.error(`❌ Error escribiendo en ${nodo}/${archivo}:`, error.message);
      throw error;
    }
  }

  // Replicar datos entre nodos
  replicate(origen, destino, archivo) {
    console.log(`🔄 Iniciando replicación: ${origen}/${archivo} → ${destino}/${archivo}`);
    
    try {
      const data = this.read(origen, archivo);
      if (!data) {
        throw new Error(`No hay datos para replicar en ${origen}/${archivo}`);
      }
      
      this.write(destino, archivo, data);
      console.log(`✅ Replicación completada: ${data.length || 0} registros copiados`);
      
      return { success: true, registros: data.length };
    } catch (error) {
      console.error(`❌ Fallo en replicación: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Obtener metadata de un nodo
  getNodeMetadata(nodo) {
    try {
      const filePath = path.join(this.dataDir, nodo, 'metadata.json');
      if (!fs.existsSync(filePath)) return null;
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  // Actualizar metadata de un nodo
  updateMetadata(nodo, updates) {
    try {
      const current = this.getNodeMetadata(nodo) || {};
      const updated = { ...current, ...updates };
      
      const filePath = path.join(this.dataDir, nodo, 'metadata.json');
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
    } catch (error) {
      console.error(`Error actualizando metadata de ${nodo}:`, error.message);
    }
  }

  // Simular caída de nodo
  simulateNodeFailure(nodo) {
    console.log(`🔴 Simulando caída del nodo ${nodo}`);
    this.updateMetadata(nodo, { 
      status: 'down', 
      failedAt: new Date().toISOString() 
    });
    
    // Actualizar registro de nodos del sistema
    const nodos = this.read('sistema', 'nodos');
    const idx = nodos.findIndex(n => n.id === nodo);
    if (idx !== -1) {
      nodos[idx].status = 'down';
      this.write('sistema', 'nodos', nodos);
    }
  }

  // Recuperar nodo
  recoverNode(nodo) {
    console.log(`🟢 Recuperando nodo ${nodo}`);
    this.updateMetadata(nodo, { 
      status: 'up', 
      recoveredAt: new Date().toISOString() 
    });
    
    const nodos = this.read('sistema', 'nodos');
    const idx = nodos.findIndex(n => n.id === nodo);
    if (idx !== -1) {
      nodos[idx].status = 'up';
      this.write('sistema', 'nodos', nodos);
    }
  }

  // Simular latencia de red (10-100ms)
  simulateNetworkLatency() {
    const latency = Math.floor(Math.random() * 90) + 10;
    const start = Date.now();
    while (Date.now() - start < latency) {
      // Busy wait para simular latencia
    }
  }

  // Listar todos los nodos disponibles
  getAvailableNodes() {
    const nodos = this.read('sistema', 'nodos');
    return nodos.filter(n => n.status === 'up');
  }
}

module.exports = new DistributedStorage();