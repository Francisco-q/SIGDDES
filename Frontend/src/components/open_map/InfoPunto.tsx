
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { ReceptionQR, TotemQR } from '../../types/types';
import './InfoPunto.css';
interface InfoPuntoProps {
  open: boolean;
  punto: TotemQR | ReceptionQR | null;
  role: string | null;
  onClose: () => void;
  onSave: (updatedPunto: TotemQR | ReceptionQR) => void;
  onDelete: (pointId: number, isTotem: boolean) => void;
}

const InfoPunto: React.FC<InfoPuntoProps> = ({ open, punto, role, onClose, onSave, onDelete }) => {
  const [editando, setEditando] = useState(false);
  const [name, setName] = useState(punto?.name || '');
  const [description, setDescription] = useState(punto?.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleEditClick = () => {
    setEditando(true);
    setName(punto?.name || '');
    setDescription(punto?.description || '');
  };

  const handleSaveClick = () => {
    if (!punto) return;
    const updatedPunto = {
      ...punto,
      name,
      description,
      imageUrl: punto.imageUrl, // Se actualiza en el padre si hay imageFile
    };
    onSave(updatedPunto);
    setEditando(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const isAdmin = ['admin', 'superuser'].includes(role as string);
  const isTotem = punto && 'campus' in punto;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: 'dialog-paper' }}
    >
      <DialogTitle className="dialog-title">Información del Punto</DialogTitle>
      <DialogContent className="dialog-content">
        {punto ? (
          <>
            <Typography variant="body1">ID: {punto.id}</Typography>
            <Typography variant="body1">
              Coordenadas: ({punto.latitude}, {punto.longitude})
            </Typography>
            {editando ? (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Descripción"
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  margin="normal"
                  multiline
                  rows={4}
                />
                {isAdmin && (
                  <>
                    <input type="file" onChange={handleImageChange} accept="image/*" style={{ marginTop: '16px' }} />
                    {punto.imageUrl && (
                      <Box sx={{ mt: 2 }}>
                        <img src={punto.imageUrl} alt={punto.name} className="image-preview" />
                      </Box>
                    )}
                  </>
                )}
              </Box>
            ) : (
              <>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Nombre: {punto.name}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Descripción: {punto.description || 'Sin descripción'}
                </Typography>
                {punto.imageUrl && (
                  <Box sx={{ mt: 2 }}>
                    <img src={punto.imageUrl} alt={punto.name} className="image-preview" />
                  </Box>
                )}
              </>
            )}
          </>
        ) : (
          <Typography>No se seleccionó ningún punto.</Typography>
        )}
      </DialogContent>
      <DialogActions className="dialog-actions">
        {editando ? (
          <>
            <Button variant="contained" color="primary" onClick={handleSaveClick}>
              Guardar
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Box>
              {isAdmin && (
                <>
                  <Button variant="contained" color="primary" onClick={handleEditClick} className="button-edit">
                    Editar Punto
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => onDelete(punto!.id, isTotem)}
                  >
                    Eliminar Punto
                  </Button>
                </>
              )}
            </Box>
            <Button variant="outlined" color="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InfoPunto;