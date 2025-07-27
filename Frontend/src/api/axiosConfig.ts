// filepath: /c:/Users/Francisco/Documents/SIGDDES/Frontend/src/api/axiosConfig.ts
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.DEV 
      ? 'http://localhost:8000/api/' 
      : 'https://front-0opi.onrender.com/api/'
  ),
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;