import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { ReceptionQR, TotemQR } from '../../../../types/types';

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
  const [images, setImages] = useState<string[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isTotem = !!punto && !('schedule' in punto);
  const isEditable = role === 'admin' || role === 'superuser';

  useEffect(() => {
    if (punto && open) {
      setName(punto.name);
      setDescription(punto.description || '');
      setSchedule(('schedule' in punto) ? (punto as ReceptionQR).schedule || '' : '');
      setStatus(punto.status || 'Operativo');
      setErrors({});
      setIsEditing(false);
      fetchImages();
    }
  }, [punto, open]);

  const fetchImages = async () => {
    if (!punto) return;
    try {
      const response = await axios.get(`http://localhost:8000/api/images/`, {
        params: {
          point_id: punto.id,
          point_type: isTotem ? 'totem' : 'reception',
          campus: punto.campus,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const fetchedImages = response.data.map((img: any) => img.image);
      setImages(fetchedImages);
      console.log('Imágenes cargadas del backend:', fetchedImages);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name || name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!punto || !validate()) return;

    const updatedPoint = {
      ...punto,
      name: name.trim(),
      description: description.trim(),
      status,
      ...(isTotem ? {} : { schedule: schedule.trim() }),
      imageUrls: images,
    };

    onSave(updatedPoint);
    setImageFiles(Array.from((document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement)?.files || []));
    await fetchImages();
    setNewImagePreviews([]);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (punto) {
      setName(punto.name);
      setDescription(punto.description || '');
      setSchedule(('schedule' in punto) ? (punto as ReceptionQR).schedule || '' : '');
      setStatus(punto.status || 'Operativo');
      setErrors({});
      setNewImagePreviews([]);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (punto) {
      setIsDeleting(true);
      onDelete(punto.id, isTotem);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setImageFiles(files);
      const previews = files.map(file => URL.createObjectURL(file));
      setNewImagePreviews(previews);
      console.log('Previsualizaciones generadas:', previews);
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isEditing ? (
              <>
                {images.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: 'text.secondary' }}>
                      Imágenes existentes:
                    </Typography>
                    <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                      {images.map((url, index) => (
                        <Box key={url || `image-${index}`} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={url}
                            alt={`Imagen existente ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                            onClick={() => {
                              setSelectedImage(url);
                              setOpenImageModal(true);
                            }}
                          />
                        </Box>
                      ))}
                    </Slider>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                    No hay imágenes disponibles
                  </Typography>
                )}
                {newImagePreviews.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: 'text.secondary' }}>
                      Nuevas imágenes:
                    </Typography>
                    <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                      {newImagePreviews.map((preview, index) => (
                        <Box key={preview || `preview-${index}`} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={preview}
                            alt={`Nueva imagen ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                            onClick={() => {
                              setSelectedImage(preview);
                              setOpenImageModal(true);
                            }}
                          />
                        </Box>
                      ))}
                    </Slider>
                  </Box>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ marginTop: '16px', marginBottom: '16px' }}
                />
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={{ mt: 2 }}
                />
                <TextField
                  label="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  sx={{ mt: 2 }}
                />
                {!isTotem && (
                  <TextField
                    label="Horario"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                )}
                <TextField
                  label="Estado"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  fullWidth
                  select
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="Operativo">Operativo</MenuItem>
                  <MenuItem value="No Operativo">No Operativo</MenuItem>
                </TextField>
              </>
            ) : (
              <>
                {images.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: 'text.secondary' }}>
                      Imágenes:
                    </Typography>
                    <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                      {images.map((url, index) => (
                        <Box key={url || `image-${index}`} sx={{ display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={url}
                            alt={`Imagen ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                            onClick={() => {
                              setSelectedImage(url);
                              setOpenImageModal(true);
                            }}
                          />
                        </Box>
                      ))}
                    </Slider>
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
                    No hay imágenes disponibles
                  </Typography>
                )}
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 2, mb: 0.5, color: 'text.secondary' }}>
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
      <Dialog open={openImageModal} onClose={() => setOpenImageModal(false)} maxWidth="md">
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {selectedImage && (
            <img src={selectedImage} alt="Imagen ampliada" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default InfoPunto;