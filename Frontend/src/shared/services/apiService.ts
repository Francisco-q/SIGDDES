import axiosInstance from '../../services/axiosInstance';

interface ApiResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}

class ApiService {
  async get<T>(url: string): Promise<T> {
    const response = await axiosInstance.get(url);
    return response.data;
  }

  async post<T>(url: string, data: any): Promise<T> {
    const response = await axiosInstance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data: any): Promise<T> {
    const response = await axiosInstance.put(url, data);
    return response.data;
  }

  async delete(url: string): Promise<void> {
    await axiosInstance.delete(url);
  }
}

export const apiService = new ApiService();
export type { ApiResponse };
