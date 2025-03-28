import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { actionsStyle, contentStyle, drawerPaperStyle, headerStyle } from './InfoPuntoStyles';

interface Punto {
  id: number;
  x: number;
  y: number;
  info: string;
}

interface InfoPuntoProps {
  id?: string;
  punto: Punto;
  onClose: () => void;
  onSave: (info: string) => void;
  onDelete: () => void;
}

const InfoPunto: React.FC<InfoPuntoProps> = ({ punto, onClose, onSave, onDelete }) => {
  const [editando, setEditando] = useState(false);
  const [info, setInfo] = useState(punto.info);

  const handleEditClick = () => {
    setEditando(true);
  };

  const handleSaveClick = () => {
    onSave(info);
    setEditando(false);
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      hideBackdrop
      PaperProps={{
        sx: drawerPaperStyle,
      }}
    >
      {/* Encabezado con botón de cierre */}
      <Box sx={headerStyle}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Contenido principal */}
      <Box sx={contentStyle}>
        <Typography variant="h5" component="h2" gutterBottom>
          Información del Punto
        </Typography>
        <Typography variant="body1">ID: {punto.id}</Typography>
        <Typography variant="body1">
          Coordenadas: ({punto.x}, {punto.y})
        </Typography>

        {editando ? (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Información"
              variant="outlined"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
            />
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleSaveClick}>
              Guardar
            </Button>
          </Box>
        ) : (
          <Typography variant="body1" sx={{ mt: 2 }}>
            Información: {punto.info}
          </Typography>
        )}
      </Box>

      {/* Pie con acciones */}
      <Box sx={actionsStyle}>
        {!editando && (
          <>
            <Button variant="outlined" onClick={handleEditClick}>
              Editar Punto
            </Button>
            <Button variant="outlined" color="error" onClick={onDelete}>
              Eliminar Punto
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default InfoPunto;
