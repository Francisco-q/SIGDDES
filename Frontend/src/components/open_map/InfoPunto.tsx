import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import React from 'react';
import { ReceptionQR, TotemQR } from '../../types/types';

interface InfoPuntoProps {
  open: boolean;
  punto: TotemQR | ReceptionQR | null;
  role: string | null;
  onClose: () => void;
  onSave: (punto: TotemQR | ReceptionQR) => void;
  onDelete: (pointId: number, isTotem: boolean) => void;
}

const InfoPunto: React.FC<InfoPuntoProps> = ({
  open,
  punto,
  role,
  onClose,
  onSave,
  onDelete,
}) => {
  const isTotem = punto && !('schedule' in punto);
  const isEditable = role === 'admin' || role === 'superuser'; // Solo admin o superuser pueden editar

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {punto ? `Información de ${isTotem ? 'Tótem QR' : 'Espacio Seguro'}` : 'Información del Punto'}
      </DialogTitle>
      <DialogContent>
        {punto ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="subtitle1" color="textSecondary">
              Nombre:
            </Typography>
            <Typography variant="body1">{punto.name}</Typography>

            <Typography variant="subtitle1" color="textSecondary">
              Descripción:
            </Typography>
            <Typography variant="body1">
              {punto.description || 'No hay descripción disponible.'}
            </Typography>

            {!isTotem && (
              <>
                <Typography variant="subtitle1" color="textSecondary">
                  Horario:
                </Typography>
                <Typography variant="body1">
                  {'schedule' in punto && punto.schedule
                    ? punto.schedule
                    : 'No hay horario disponible.'}
                </Typography>
              </>
            )}

            <Typography variant="subtitle1" color="textSecondary">
              Estado:
            </Typography>
            <Typography variant="body1">{punto.status}</Typography>
          </Box>
        ) : (
          <Typography>No hay información disponible.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
        {isEditable && punto && (
          <>
            <Button onClick={() => onSave(punto)} color="primary">
              Editar
            </Button>
            <Button
              onClick={() => onDelete(punto.id, isTotem)}
              color="error"
            >
              Eliminar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InfoPunto;