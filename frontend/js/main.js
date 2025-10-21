// Mostrar notificaciones
function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showWarning(message) {
  showNotification(message, 'warning');
}

function showNotification(message, type = 'info') {
  const container = document.getElementById('notifications') || createNotificationContainer();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  
  container.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notifications';
  container.className = 'notification-container';
  document.body.appendChild(container);
  return container;
}

// Formatear fecha
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('es-ES');
}

// Formatear JSON
function formatJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

// Copiar al portapapeles
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  showSuccess('Copiado al portapapeles');
}

// Hacer petición API
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: getHeaders()
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  }
}