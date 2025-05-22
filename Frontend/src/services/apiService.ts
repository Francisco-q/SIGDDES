import axios, { AxiosInstance } from 'axios';
import { Path, ReceptionQR, TotemQR } from '../types/types';
import axiosInstance from './axiosInstance';

// Create a custom Axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store refresh promise to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}> = [];

// Process queued requests after token refresh
const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken,
        });

        const newToken = response.data.access;
        localStorage.setItem('access_token', newToken);

        // Update headers for queued requests
        processQueue(null, newToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Redirect to login or handle session expiration
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const fetchTotems = async (campus: string): Promise<TotemQR[]> => {
  const response = await api.get(`totems/?campus=${campus}`);
  return response.data;
};

export const fetchReceptions = async (campus: string): Promise<ReceptionQR[]> => {
  const response = await api.get(`recepciones/?campus=${campus}`);
  return response.data;
};

export const fetchPaths = async (campus: string): Promise<Path[]> => {
  const response = await api.get(`caminos/?campus=${campus}`);
  return response.data.map((path: any) => ({
    id: path.id,
    name: path.name,
    points: path.points.map((point: any) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })),
    campus: path.campus,
  }));
};

export const createTotem = async (data: TotemQR): Promise<TotemQR> => {
  const response = await api.post('totems/', data);
  return response.data;
};

export const createReception = async (data: ReceptionQR): Promise<ReceptionQR> => {
  const response = await api.post('recepciones/', data);
  return response.data;
};

export const updateTotem = async (id: number, data: TotemQR): Promise<TotemQR> => {
  const response = await api.put(`totems/${id}/`, data);
  return response.data;
};

export const updateReception = async (id: number, data: ReceptionQR): Promise<ReceptionQR> => {
  const response = await api.put(`recepciones/${id}/`, data);
  return response.data;
};

export const deleteTotem = async (id: number): Promise<void> => {
  await api.delete(`totems/${id}/`);
};

export const deleteReception = async (id: number): Promise<void> => {
  await api.delete(`recepciones/${id}/`);
};

export const uploadImage = async (formData: FormData): Promise<{ image: string }> => {
  const response = await api.post('image-upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createPath = async (data: Path): Promise<Path> => {
  const response = await api.post('caminos/', data);
  return response.data;
};

export const fetchInitialPoint = async (
  pointId: string,
  pointType: string,
  campus: string
): Promise<TotemQR | ReceptionQR> => {
  const endpoint = pointType === 'totem' ? 'totems' : 'recepciones';
  const response = await api.get(`${endpoint}/${pointId}/?campus=${campus}`);
  return response.data;
};

export const submitDenuncia = async (data: any): Promise<any> => {
  const response = await api.post('denuncias/', data);
  return response.data;
};

export const fetchImages = async (
  pointId: number,
  pointType: string,
  campus: string
): Promise<string[]> => {
  const response = await api.get('images/', {
    params: { point_id: pointId, point_type: pointType, campus },
  });
  return response.data.map((img: any) => img.image);
};

export const generateQrCode = async (
  id: number,
  isTotem: boolean
): Promise<{ qr_image: string }> => {
  const endpoint = isTotem ? 'totems' : 'recepciones';
  const response = await api.post(`${endpoint}/${id}/generate_qr/`, {});
  return response.data;
};

export const uploadImages = async (files: File[], pointId: number, pointType: string, campus: string): Promise<string[]> => {
  const newImageUrls: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('point_id', pointId.toString());
    formData.append('point_type', pointType);
    formData.append('campus', campus);
    const response = await axiosInstance.post('image-upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    newImageUrls.push(response.data.image);
  }
  return newImageUrls;
};