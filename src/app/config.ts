

const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env['API_URL']) {
    return process.env['API_URL'];
  }

  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }
    return 'https://backend-inventario-qy76.onrender.com';
  }
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();