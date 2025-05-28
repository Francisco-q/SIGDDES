export const API_CONFIG = {
    // @ts-ignore
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    ENDPOINTS: {
        IMAGES: '/api/images/',
        TOTEMS: '/api/totems/',
        RECEPCIONES: '/api/recepciones/',
        TOKEN: 'token/' // Asegúrate de que no incluya /api/ aquí
    },
};