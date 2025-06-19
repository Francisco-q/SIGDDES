import axios from 'axios';

// Validar VITE_API_BASE_URL con un valor por defecto
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';
if (!import.meta.env.VITE_API_BASE_URL) {
    console.warn('VITE_API_BASE_URL no está definido en .env. Usando valor por defecto:', baseURL);
}

const axiosInstance = axios.create({
    baseURL,
    timeout: 10000, // 10 segundos de timeout para evitar peticiones colgadas
});

// Interceptor para agregar el token y log headers
axiosInstance.interceptors.request.use(
    (config) => {
        console.log(`Enviando petición a: ${config.baseURL}${config.url}`);
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token agregado a la petición:', token.substring(0, 10) + '...');
        } else {
            console.warn('No se encontró access_token en localStorage');
        }
        // Log headers para depuración
        console.log('Headers enviados:', config.headers);
        // Evitar establecer Content-Type para FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        console.error('Error en el interceptor de solicitud:', error);
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores 401 y refresh del token
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`Respuesta recibida de ${response.config.url}:`, response.status);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response) {
            console.error(`Error ${error.response.status} en ${error.config.url}:`, error.response.data);
        } else {
            console.error('Error de red o CORS:', error.message);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.log('Intento de renovar token...');
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                console.log('Enviando petición de refresh a /token/refresh/');
                const response = await axios.post(
                    `${baseURL}token/refresh/`,
                    { refresh: refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );
                const newToken = response.data.access;
                console.log('Nuevo token recibido:', newToken.substring(0, 10) + '...');
                localStorage.setItem('access_token', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error('Error al renovar el token:', refreshError);
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                console.log('Redirigiendo al login...');
                window.location.href = '/'; // Redirigir al login
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;