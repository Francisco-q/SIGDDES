import React from 'react';
import { Card } from '../../../shared/components/ui';
import type { TotemQR } from '../../../types/types';

interface TotemCardProps {
  totem: TotemQR;
  onEdit?: (totem: TotemQR) => void;
  onDelete?: (id: number) => void;
}

export const TotemCard: React.FC<TotemCardProps> = ({ 
  totem, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900">{totem.name}</h3>
        <span 
          className={`px-2 py-1 rounded text-xs font-medium ${
            totem.status === 'Operativo' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {totem.status}
        </span>
      </div>
      
      {totem.description && (
        <p className="text-gray-600 text-sm mb-3">{totem.description}</p>
      )}
      
      <div className="text-sm text-gray-500 space-y-1">
        <p><span className="font-medium">Campus:</span> {totem.campus}</p>
        <p><span className="font-medium">Coordenadas:</span> {totem.latitude.toFixed(6)}, {totem.longitude.toFixed(6)}</p>
        {totem.qr_image && (
          <p className="text-green-600">
            <span className="font-medium">QR:</span> Generado
          </p>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4">
          {onEdit && (
            <button
              onClick={() => onEdit(totem)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(totem.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </Card>
  );
};
