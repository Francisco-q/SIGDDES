import { useState, useCallback } from 'react';
import { useAsyncOperation } from '../../../shared/hooks';
import { apiService } from '../../../shared/services/apiService';

export interface Denuncia {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipo_incidente: string;
  fecha_incidente: string;
  lugar_incidente: string;
  descripcion: string;
  campus?: string;
  encargado_acogida?: string;
  estado?: 'pendiente' | 'tomada';
  comentarios?: string;
  created_at?: string;
  updated_at?: string;
}

export const useIncidentReports = () => {
  const [reports, setReports] = useState<Denuncia[]>([]);
  const { loading, error, execute } = useAsyncOperation<any>();

  const fetchReports = useCallback(async () => {
    const response = await execute(() => 
      apiService.get<{ results: Denuncia[] }>('/denuncias/')
    );
    if (response) {
      setReports(response.results);
    }
  }, [execute]);

  const submitReport = useCallback(async (reportData: Omit<Denuncia, 'id'>) => {
    const newReport = await execute(() =>
      apiService.post<Denuncia>('/denuncias/', reportData)
    );
    if (newReport) {
      setReports(prev => [...prev, newReport]);
    }
    return newReport;
  }, [execute]);

  const updateReportStatus = useCallback(async (id: number, status: 'pendiente' | 'tomada', comentarios?: string) => {
    const updatedReport = await execute(() =>
      apiService.put<Denuncia>(`/denuncias/${id}/`, { estado: status, comentarios })
    );
    if (updatedReport) {
      setReports(prev => 
        prev.map(report => 
          report.id === id ? { ...report, estado: status, comentarios } : report
        )
      );
    }
    return updatedReport;
  }, [execute]);

  return {
    reports,
    loading,
    error,
    fetchReports,
    submitReport,
    updateReportStatus
  };
};
