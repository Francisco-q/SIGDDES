import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  MenuItem,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React, { useState, useEffect } from 'react';
import { ReceptionQR, TotemQR } from '../../types/types';

interface InfoPuntoProps {
  open: boolean;
  punto: TotemQR | ReceptionQR | null;
  role: string | null;
  onClose: () => void;
  onSave: (punto: TotemQR | ReceptionQR) => void;
  onDelete: (pointId: number, isTotem: boolean) => void;
  setImageFiles: (files: File[]) => void;
}

const InfoPunto: React.FC<InfoPuntoProps> = ({
  open,
  punto,
  role,
  onClose,
  onSave,
  onDelete,
  setImageFiles,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [status, setStatus] = useState('Operativo');
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const isTotem = !!punto && !('schedule' in punto);
  const isEditable = role === 'admin' || role === 'superuser';

  // Sincronizar estados cuando cambia el punto
  useEffect(() => {
    if (punto) {
      setName(punto.name);
      setDescription(punto.description || '');
      setSchedule(('schedule' in punto) ? (punto as ReceptionQR).schedule || '' : '');
      setStatus(punto.status || 'Operativo');
      setErrors({});
      setIsEditing(false);
    }
  }, [punto]);

  // Validación de campos
  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name || name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar guardado
  const handleSave = () => {
    if (!punto || !validate()) return;

    const updatedPoint = {
      ...punto,
      name: name.trim(),
      description: description.trim(),
      status,
      ...(isTotem ? {} : { schedule: schedule.trim() }),
    };

    console.log('Guardando punto:', updatedPoint); // Log para depuración
    onSave(updatedPoint);
    setIsEditing(false);
  };

  // Manejar cancelar edición
  const handleCancel = () => {
    if (punto) {
      setName(punto.name);
      setDescription(punto.description || '');
      setSchedule(('schedule' in punto) ? (punto as ReceptionQR).schedule || '' : '');
      setStatus(punto.status || 'Operativo');
      setErrors({});
    }
    setIsEditing(false);
  };

  // Manejar eliminación
  const handleDelete = () => {
    if (punto) {
      setIsDeleting(true);
      console.log('Eliminando punto:', { id: punto.id, isTotem }); // Log para depuración
      onDelete(punto.id, isTotem);
    }
  };

  // Manejar carga de imágenes
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setImageFiles(Array.from(event.target.files));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '80vw',
          maxWidth: '600px',
          minWidth: '300px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#fff',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          fontSize: '1.5rem',
          fontWeight: 600,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {punto ? `Información de ${isTotem ? 'Tótem QR' : 'Espacio Seguro'}` : 'Información del Punto'}
        <IconButton onClick={onClose} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          padding: '24px',
          maxHeight: '60vh',
          overflowY: 'auto',
        }}
      >
        {punto ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {isEditing ? (
              <>
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mb: 2 }}
                />
                {!isTotem && (
                  <TextField
                    label="Horario"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                )}
                <TextField
                  label="Estado"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  fullWidth
                  select
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="Operativo">Operativo</MenuItem>
                  <MenuItem value="No Operativo">No Operativo</MenuItem>
                </TextField>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ marginTop: '16px', marginBottom: '16px' }}
                />
              </>
            ) : (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  Nombre:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {punto.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  Descripción:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {punto.description || 'No hay descripción disponible.'}
                </Typography>
                {!isTotem && (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                      Horario:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {'schedule' in punto && punto.schedule
                        ? punto.schedule
                        : 'No hay horario disponible.'}
                    </Typography>
                  </>
                )}
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                  Estado:
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {punto.status}
                </Typography>
              </>
            )}
            {punto.imageUrls && punto.imageUrls.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: 'text.secondary' }}>
                  Imágenes:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  {punto.imageUrls.map((url, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: { xs: '80px', sm: '120px' },
                        height: { xs: '80px', sm: '120px' },
                      }}
                    >
                      <img
                        src={url}
                        alt={`Imagen ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Typography>No hay información disponible.</Typography>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        {isEditable && punto && (
          <>
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancel}
                  color="secondary"
                  variant="outlined"
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  color="primary"
                  variant="contained"
                  disabled={!name || name.trim().length < 2}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Guardar
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  color="primary"
                  variant="contained"
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Editar
                </Button>
                <Button
                  onClick={handleDelete}
                  color="error"
                  variant="contained"
                  disabled={isDeleting}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Eliminar
                </Button>
              </>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InfoPunto;