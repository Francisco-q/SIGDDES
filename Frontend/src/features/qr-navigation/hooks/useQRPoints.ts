import { useState, useCallback } from 'react';
import { useAsyncOperation } from '../../../shared/hooks';
import { apiService } from '../../../shared/services/apiService';
import type { TotemQR, ReceptionQR } from '../../../types/types';

export const useQRPoints = (campus: string = '') => {
  const [totemQRs, setTotemQRs] = useState<TotemQR[]>([]);
  const [receptionQRs, setReceptionQRs] = useState<ReceptionQR[]>([]);
  const { loading, error, execute } = useAsyncOperation<any>();

  const fetchTotemQRs = useCallback(async () => {
    const response = await execute(() => 
      apiService.get<{ results: TotemQR[] }>(`/totems/?campus=${campus}`)
    );
    if (response) {
      setTotemQRs(response.results);
    }
  }, [execute, campus]);

  const fetchReceptionQRs = useCallback(async () => {
    const response = await execute(() => 
      apiService.get<{ results: ReceptionQR[] }>(`/receptions/?campus=${campus}`)
    );
    if (response) {
      setReceptionQRs(response.results);
    }
  }, [execute, campus]);

  const fetchAllQRPoints = useCallback(async () => {
    await Promise.all([fetchTotemQRs(), fetchReceptionQRs()]);
  }, [fetchTotemQRs, fetchReceptionQRs]);

  return {
    totemQRs,
    receptionQRs,
    loading,
    error,
    fetchTotemQRs,
    fetchReceptionQRs,
    fetchAllQRPoints
  };
};
