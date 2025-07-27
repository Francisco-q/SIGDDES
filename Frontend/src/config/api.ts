// src/config/api.ts
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  isDevelopment 
    ? 'http://localhost:8000' 
    : 'https://front-0opi.onrender.com'
);

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    TOTEMS: '/api/totems/',
    RECEPTIONS: '/api/receptions/',
    PATHS: '/api/paths/',
    DENUNCIAS: '/api/denuncias/',
    REPORTES: '/api/reportes-atencion/',
    AUTH: '/api/auth/',
    IMAGES: '/api/images/',
  },
  TIMEOUT: 10000,
};

export default API_CONFIG;
