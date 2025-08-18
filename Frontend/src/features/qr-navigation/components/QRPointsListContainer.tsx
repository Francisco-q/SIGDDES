import React, { useEffect } from 'react';
import { useQRPoints } from '../hooks';
import { QRPointsListPresentation } from './QRPointsListPresentation';
import type { TotemQR, ReceptionQR } from '../../../types/types';

interface QRPointsListContainerProps {
  campus?: string;
  onEditTotem?: (totem: TotemQR) => void;
  onDeleteTotem?: (id: number) => void;
  onEditReception?: (reception: ReceptionQR) => void;
  onDeleteReception?: (id: number) => void;
}

export const QRPointsListContainer: React.FC<QRPointsListContainerProps> = ({
  campus = '',
  onEditTotem,
  onDeleteTotem,
  onEditReception,
  onDeleteReception
}) => {
  const { 
    totemQRs, 
    receptionQRs, 
    loading, 
    error, 
    fetchAllQRPoints 
  } = useQRPoints(campus);

  useEffect(() => {
    fetchAllQRPoints();
  }, [fetchAllQRPoints]);

  return (
    <QRPointsListPresentation
      totemQRs={totemQRs}
      receptionQRs={receptionQRs}
      loading={loading}
      error={error}
      onEditTotem={onEditTotem}
      onDeleteTotem={onDeleteTotem}
      onEditReception={onEditReception}
      onDeleteReception={onDeleteReception}
    />
  );
};
