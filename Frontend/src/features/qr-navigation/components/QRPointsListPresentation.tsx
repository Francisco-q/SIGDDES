import React from 'react';
import { LoadingSpinner } from '../../../shared/components/ui';
import { TotemCard } from './TotemCard';
import type { TotemQR, ReceptionQR } from '../../../types/types';

interface QRPointsListPresentationProps {
  totemQRs: TotemQR[];
  receptionQRs: ReceptionQR[];
  loading: boolean;
  error: string | null;
  onEditTotem?: (totem: TotemQR) => void;
  onDeleteTotem?: (id: number) => void;
  onEditReception?: (reception: ReceptionQR) => void;
  onDeleteReception?: (id: number) => void;
}

export const QRPointsListPresentation: React.FC<QRPointsListPresentationProps> = ({
  totemQRs,
  receptionQRs,
  loading,
  error,
  onEditTotem,
  onDeleteTotem,
  onEditReception,
  onDeleteReception
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800 text-sm">Error: {error}</p>
      </div>
    );
  }

  const hasNoData = totemQRs.length === 0 && receptionQRs.length === 0;

  if (hasNoData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron puntos QR</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tótems QR */}
      {totemQRs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tótems QR ({totemQRs.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {totemQRs.map(totem => (
              <TotemCard
                key={totem.id}
                totem={totem}
                onEdit={onEditTotem}
                onDelete={onDeleteTotem}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recepciones QR */}
      {receptionQRs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recepciones QR ({receptionQRs.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receptionQRs.map(reception => (
              <div key={reception.id} className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium">{reception.name}</h3>
                <p className="text-sm text-gray-600">{reception.description}</p>
                <p className="text-xs text-gray-500 mt-2">Campus: {reception.campus}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
