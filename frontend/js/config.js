// Configuración global
const API_URL = 'http://localhost:4000/api';

// Verificar autenticación
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token && !window.location.pathname.includes('index.html')) {
    window.location.href = 'index.html';
  }
  return token;
}

// Headers con autenticación
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  };
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}