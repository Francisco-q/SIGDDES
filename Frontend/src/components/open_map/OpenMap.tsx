import { zodResolver } from '@hookform/resolvers/zod';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Tab,
  Tabs,
  TextField
} from '@mui/material';
import { TotemQR, ReceptionQR, Path, PathPoint } from '../../types/types';
import { fetchTotems, fetchReceptions, fetchPaths } from '../../services/apiService';

import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImageOverlay, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import SetView from './SetView';



// Esquema de validación para el formulario de denuncia
const formSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).optional(),
  apellido: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }).optional(),
  email: z.string().email({ message: 'Por favor ingrese un email válido.' }).optional(),
  telefono: z.string().min(8, { message: 'Por favor ingrese un número de teléfono válido.' }).optional(),
  tipoIncidente: z.string({ required_error: 'Por favor seleccione un tipo de incidente.' }),
  fechaIncidente: z.string({ required_error: 'Por favor ingrese la fecha del incidente.' }),
  lugarIncidente: z.string().min(2, { message: 'Por favor ingrese el lugar del incidente.' }),
  descripcion: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
  anonimo: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

const OpenMap: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();
  const navigate = useNavigate();

  const svgBounds: [[number, number], [number, number]] = [
    [51.505, -0.09],
    [51.51, -0.1],
  ];

  const getMapaSrc = (campus: string | undefined) => {
    if (!campus) return '';
    return `/assets/${campus}.svg`;
  };

  const [totems, setTotems] = useState<TotemQR[]>([]);
  const [receptions, setReceptions] = useState<ReceptionQR[]>([]);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [showPaths, setShowPaths] = useState(false);
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [isCreatingTotem, setIsCreatingTotem] = useState(false);
  const [isCreatingReception, setIsCreatingReception] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<TotemQR | ReceptionQR | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pathName, setPathName] = useState('');
  const [tabValue, setTabValue] = useState(0); // Estado para las pestañas
  const [submitted, setSubmitted] = useState(false); // Estado para el envío del formulario

  // Configuración del formulario
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      tipoIncidente: '',
      fechaIncidente: '',
      lugarIncidente: '',
      descripcion: '',
      anonimo: false,
    },
  });

  const handlePointClick = (point: TotemQR | ReceptionQR) => {
    setSelectedPoint(point);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoint(null);
    setImageFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectedPoint) {
      setSelectedPoint({ ...selectedPoint, [e.target.name]: e.target.value });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!selectedPoint) return;

    try {
      let imageUrl = selectedPoint.imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await fetch('http://localhost:8000/api/upload/', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Error al subir la imagen');
        const data = await response.json();
        imageUrl = data.imageUrl;
      }

      const updatedPoint = { ...selectedPoint, imageUrl };
      const endpoint = 'campus' in selectedPoint ? 'totems' : 'recepciones';
      const response = await fetch(`http://localhost:8000/api/${endpoint}/${selectedPoint.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPoint),
      });

      if (!response.ok) throw new Error('Error al actualizar el punto');

      if (endpoint === 'totems') {
        setTotems(totems.map(t => (t.id === updatedPoint.id ? updatedPoint : t)));
      } else {
        setReceptions(receptions.map(r => (r.id === updatedPoint.id ? updatedPoint : r)));
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  useEffect(() => {
    if (campus) {
      // Cargar tótems específicos del campus
      fetchTotems(campus)
        .then((data) => setTotems(data))
        .catch((error) => console.error('Error fetching totems:', error));
  
      // Cargar recepciones específicas del campus
      fetchReceptions(campus)
        .then((data) => setReceptions(data))
        .catch((error) => console.error('Error fetching receptions:', error));
  
      // Cargar caminos específicos del campus
      fetchPaths(campus)
        .then((data) => setPaths(data))
        .catch((error) => console.error('Error fetching paths:', error));
    }
  }, [campus]);

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        if (isCreatingPath) {
          setCurrentPathPoints([...currentPathPoints, [lat, lng]]);
        } else if (isCreatingTotem) {
          const newTotem: Omit<TotemQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Totem QR',
            description: 'def',
            imageUrl: '',
            campus: campus || '',
          };
          saveTotem(newTotem);
          setIsCreatingTotem(false);
        } else if (isCreatingReception) {
          const newReception: Omit<ReceptionQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Espacio Seguro',
            description: '',
            imageUrl: '',
          };
          saveReception(newReception);
          setIsCreatingReception(false);
        }
      },
    });
    return null;
  };

  const saveTotem = async (totem: Omit<TotemQR, 'id'>) => {
    try {
      const response = await fetch('http://localhost:8000/api/totems/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(totem),
      });
      if (!response.ok) throw new Error('Error al guardar el totem');
      const savedTotem: TotemQR = await response.json();
      setTotems([...totems, savedTotem]);
      setIsCreatingTotem(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const saveReception = async (reception: Omit<ReceptionQR, 'id'>) => {
    try {
      const response = await fetch('http://localhost:8000/api/recepciones/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reception),
      });
      if (!response.ok) throw new Error('Error al guardar la recepción');
      const savedReception: ReceptionQR = await response.json();
      setReceptions([...receptions, savedReception]);
      setIsCreatingReception(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const savePath = async () => {
    if (currentPathPoints.length < 2) {
      alert('El camino debe tener al menos dos puntos.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const confirmSavePath = async () => {
    const trimmedName = pathName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      alert('Por favor, ingresa un nombre válido para el camino.');
      return;
    }

    const pathData = {
      name: trimmedName,
      points: currentPathPoints.map((point, index) => ({
        latitude: point[0],
        longitude: point[1],
        order: index + 1,
      })),
    };

    try {
      const response = await fetch('http://localhost:8000/api/caminos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pathData),
      });
      if (!response.ok) throw new Error('Error al guardar el camino');
      const savedPath: Path = await response.json();
      setPaths([...paths, savedPath]);
      setCurrentPathPoints([]);
      setIsCreatingPath(false);
      setIsConfirmModalOpen(false);
      setPathName('');
      alert('Camino guardado exitosamente.');
    } catch (error) {
      console.error('Error:', error);
      setIsConfirmModalOpen(false);
      setPathName('');
      alert('Hubo un error al guardar el camino.');
    }
  };

  const toggleShowPaths = () => {
    setShowPaths(!showPaths);
  };

  const onSubmit = async (data: FormData) => {
    console.log('Formulario enviado:', data);
    // Aquí enviaríamos los datos al backend (lo configuraremos más adelante)
    setSubmitted(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ zIndex: 1000, backgroundColor: 'rgba(238, 219, 255, 0.68)' }}>
        <Tab label="Mapa" />
        <Tab label="Denuncia" />
      </Tabs>

      {/* Pestaña Mapa */}
      {
        tabValue === 0 && (
          <Box sx={{ flex: 1, position: 'relative' }}>
            <MapContainer style={{ height: '100%', width: '100%', backgroundColor: 'rgba(238, 219, 255, 0.68)' }} zoom={18} maxZoom={22} minZoom={10} zoomControl={false}>
              {!isCreatingPath && <SetView bounds={svgBounds} zoom={18} />} {/* Solo centra el mapa si no estás creando caminos */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                opacity={0}
                maxZoom={19}
                minZoom={10}
              />
              {campus && (
                <ImageOverlay
                  url={getMapaSrc(campus)}
                  bounds={svgBounds}
                  opacity={1}
                  eventHandlers={{ error: () => console.error('Error al cargar el archivo SVG') }}
                />
              )}
              <MapClickHandler />
              {totems.map(totem => (
                <Marker
                  key={totem.id}
                  position={[totem.latitude, totem.longitude]}
                  interactive={!isCreatingPath}
                  eventHandlers={{ click: () => !isCreatingPath && handlePointClick(totem) }}
                >
                  <Popup>{totem.name}</Popup>
                </Marker>
              ))}
              {receptions.map(reception => (
                <Marker
                  key={reception.id}
                  position={[reception.latitude, reception.longitude]}
                  interactive={!isCreatingPath}
                  eventHandlers={{ click: () => !isCreatingPath && handlePointClick(reception) }}
                >
                  <Popup>{reception.name}</Popup>
                </Marker>
              ))}
              {currentPathPoints.length > 1 && <Polyline positions={currentPathPoints} color="red" weight={5} />}
              {showPaths && paths.map(path => (
                <Polyline key={path.id} positions={path.points.map(p => [p.latitude, p.longitude])} color="blue" weight={5} />
              ))}
              {selectedPath && (
                <Polyline positions={selectedPath.points.map(p => [p.latitude, p.longitude])} color="blue" weight={5} />
              )}
              <ZoomControl position="topright" />
            </MapContainer>
          </Box>
        )
      }

      {/* Pestaña Denuncia */}
      {
        tabValue === 1 && (
          <Box sx={{ flex: 1, p: 3, overflow: 'auto', backgroundColor: 'rgb(255, 255, 255)' }}>
            {submitted ? (
              <Box sx={{ textAlign: 'center', mt: 10 }}>
                <h2>Denuncia Enviada</h2>
                <p>Su denuncia ha sido recibida y será procesada a la brevedad.</p>
                <Button onClick={() => { setSubmitted(false); form.reset(); }} sx={{ mt: 2 }}>
                  Realizar otra denuncia
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ maxWidth: 900, mx: 'auto' }}>
                <h2>Formulario de Denuncia</h2>
                <p>Complete el formulario para reportar un incidente relacionado con violencia o discriminación de género.</p>

                <Box sx={{ mt: 2 }}>
                  <h3>Información Personal</h3>
                  <TextField
                    label="Nombre"
                    {...form.register('nombre')}
                    error={!!form.formState.errors.nombre}
                    helperText={form.formState.errors.nombre?.message}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Apellido"
                    {...form.register('apellido')}
                    error={!!form.formState.errors.apellido}
                    helperText={form.formState.errors.apellido?.message}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Correo Electrónico"
                    type="email"
                    {...form.register('email')}
                    error={!!form.formState.errors.email}
                    helperText={form.formState.errors.email?.message}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Teléfono"
                    {...form.register('telefono')}
                    error={!!form.formState.errors.telefono}
                    helperText={form.formState.errors.telefono?.message}
                    fullWidth
                    margin="normal"
                  />
                  <FormControl component="fieldset" margin="normal">
                    <RadioGroup
                      row
                      value={form.watch('anonimo') ? 'true' : 'false'}
                      onChange={(e) => form.setValue('anonimo', e.target.value === 'true')}
                    >
                      <FormControlLabel value="false" control={<Radio />} label="Denuncia con datos personales" />
                      <FormControlLabel value="true" control={<Radio />} label="Denuncia anónima" />
                    </RadioGroup>
                    <p>Si elige denuncia anónima, sus datos personales no serán visibles.</p>
                  </FormControl>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <h3>Detalles del Incidente</h3>
                  <FormControl fullWidth margin="normal" error={!!form.formState.errors.tipoIncidente}>
                    <InputLabel>Tipo de Incidente</InputLabel>
                    <Select
                      {...form.register('tipoIncidente')}
                      value={form.watch('tipoIncidente')}
                      onChange={(e) => form.setValue('tipoIncidente', e.target.value as string)}
                    >
                      <MenuItem value="">Seleccione el tipo de incidente</MenuItem>
                      <MenuItem value="acoso_sexual">Acoso Sexual</MenuItem>
                      <MenuItem value="violencia_fisica">Violencia Física</MenuItem>
                      <MenuItem value="violencia_psicologica">Violencia Psicológica</MenuItem>
                      <MenuItem value="discriminacion">Discriminación de Género</MenuItem>
                      <MenuItem value="acoso_laboral">Acoso Laboral</MenuItem>
                      <MenuItem value="otro">Otro</MenuItem>
                    </Select>
                    {form.formState.errors.tipoIncidente && (
                      <p style={{ color: 'red' }}>{form.formState.errors.tipoIncidente.message}</p>
                    )}
                  </FormControl>
                  <TextField
                    label="Fecha del Incidente"
                    type="date"
                    {...form.register('fechaIncidente')}
                    error={!!form.formState.errors.fechaIncidente}
                    helperText={form.formState.errors.fechaIncidente?.message}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Lugar del Incidente"
                    {...form.register('lugarIncidente')}
                    error={!!form.formState.errors.lugarIncidente}
                    helperText={form.formState.errors.lugarIncidente?.message}
                    fullWidth
                    margin="normal"
                  />
                  <TextField
                    label="Descripción del Incidente"
                    multiline
                    rows={4}
                    {...form.register('descripcion')}
                    error={!!form.formState.errors.descripcion}
                    helperText={form.formState.errors.descripcion?.message || 'Incluya todos los detalles relevantes.'}
                    fullWidth
                    margin="normal"
                  />
                </Box>

                <Button type="submit" color="primary" sx={{ mt: 2 }}>
                  Enviar Denuncia
                </Button>
              </Box>
            )}
          </Box>
        )
      }
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(238, 219, 255, 0.68)',
          boxShadow: 3,
          padding: 2,
          zIndex: 1000,
        }}
      >
        <Button
          onClick={handleGoHome}
          color="primary"
          sx={{ marginRight: 2 }}
        >
          HOMEPAGE
        </Button>

        <Button
          onClick={() => {
            if (isCreatingPath) {
              setIsCreatingPath(false);
              setCurrentPathPoints([]);
              setPathName('');
            } else {
              setIsCreatingPath(true);
            }
          }}
          disabled={isCreatingTotem || isCreatingReception}
          color={isCreatingPath ? 'secondary' : 'primary'}
          sx={{ marginRight: 2 }}
        >
          {isCreatingPath ? 'Cancelar Crear Camino' : 'Crear Camino'}
        </Button>

        {isCreatingPath && (
          <Button
            onClick={savePath}
            color="success"
            sx={{ marginRight: 2 }}
          >
            Guardar Camino
          </Button>
        )}

        <Button
          onClick={() => setIsCreatingTotem(!isCreatingTotem)}
          disabled={isCreatingPath || isCreatingReception}
          color={isCreatingTotem ? 'secondary' : 'primary'}
          sx={{ marginRight: 2 }}
        >
          {isCreatingTotem ? 'Cancelar Crear Punto QR' : 'Crear Punto QR'}
        </Button>

        <Button
          onClick={() => setIsCreatingReception(!isCreatingReception)}
          disabled={isCreatingPath || isCreatingTotem}
          color={isCreatingReception ? 'secondary' : 'primary'}
          sx={{ marginRight: 2 }}
        >
          {isCreatingReception ? 'Cancelar Espacio Seguro' : 'Crear Espacio Seguro'}
        </Button>

        <Button
          onClick={toggleShowPaths}
          color={showPaths ? 'secondary' : 'primary'}
        >
          {showPaths ? 'Ocultar Caminos' : 'Mostrar Caminos'}
        </Button>
      </Box>

      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle>Editar Información</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre"
            name="name"
            value={selectedPoint?.name || ''}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Descripción"
            name="description"
            value={selectedPoint?.description || ''}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <input type="file" onChange={handleImageChange} />
          {selectedPoint?.imageUrl && (
            <img src={selectedPoint.imageUrl} alt={selectedPoint.name} style={{ width: '100%', marginTop: '10px' }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSave} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <DialogTitle>Confirmar Guardado del Camino</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre del camino"
            value={pathName}
            onChange={(e) => setPathName(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Ingresa un nombre"
            required
            error={!pathName.trim() || pathName.trim().length < 3}
            helperText={
              !pathName.trim()
                ? 'El nombre es obligatorio'
                : pathName.trim().length < 3
                  ? 'Mínimo 3 caracteres'
                  : ''
            }
          />
          <p>¿Estás seguro de que deseas guardar este camino?</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setIsConfirmModalOpen(false); setPathName(''); }} color="secondary">
            Cancelar
          </Button>
          <Button onClick={confirmSavePath} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default OpenMap;