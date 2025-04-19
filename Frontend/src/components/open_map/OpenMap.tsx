import { zodResolver } from '@hookform/resolvers/zod';
import {
  Cancel as CancelIcon,
  Home as HomeIcon,
  QrCode as QrCodeIcon,
  Route as RouteIcon,
  Save as SaveIcon,
  ShieldMoon as ShieldIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImageOverlay, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import ColchaguaSvg from '../../assets/Colchagua.svg';
import CuricoSvg from '../../assets/Curico.svg';
import PehuencheSvg from '../../assets/Pehuenche.svg';
import SantiagoSvg from '../../assets/Santiago.svg';
import TalcaSvg from '../../assets/Talca.svg';
import { fetchPaths, fetchReceptions, fetchTotems } from '../../services/apiService';
import { Path, ReceptionQR, TotemQR } from '../../types/types';
import InfoPunto from './InfoPunto';
import './OpenMap.css';
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
  campus: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const OpenMap: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [svgError, setSvgError] = useState<string | null>(null);

  const svgBounds: [[number, number], [number, number]] = [
    [51.505, -0.09],
    [51.51, -0.1],
  ];

  const getMapaSrc = (campus: string | undefined) => {
    if (!campus) {
      return { src: '', error: 'No se especificó un campus.' };
    }
    switch (campus.toLowerCase()) {
      case 'talca':
        return { src: TalcaSvg, error: null };
      case 'curico':
        return { src: CuricoSvg, error: null };
      case 'colchagua':
        return { src: ColchaguaSvg, error: null };
      case 'pehuenche':
        return { src: PehuencheSvg, error: null };
      case 'santiago':
        return { src: SantiagoSvg, error: null };
      default:
        return { src: '', error: `No se encontró un mapa para el campus ${campus}.` };
    }
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
  const [tabValue, setTabValue] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: refreshToken,
      });
      localStorage.setItem('access_token', response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
      setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      return null;
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setIsAuthenticated(false);
        setError('No hay sesión activa. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/user/current_user/', {
          headers: { Authorization: `Bearer ${accessToken} ` },
        });
        console.log('Respuesta de /api/user/current_user/:', response.data);
        setRole(response.data.role);
        setIsAuthenticated(true);
        setError(null);
      } catch (error: any) {
        if (error.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            try {
              const response = await axios.get('http://localhost:8000/api/user/current_user/', {
                headers: { Authorization: `Bearer ${newToken} ` },
              });
              console.log('Respuesta después de refresh:', response.data);
              setRole(response.data.role);
              setIsAuthenticated(true);
              setError(null);
              return;
            } catch (retryError) {
              console.error('Error validating token after refresh:', retryError);
            }
          }
        }
        setIsAuthenticated(false);
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  useEffect(() => {
    if (isAuthenticated && role && ['admin', 'user', 'guest', 'superuser'].includes(role) && campus) {
      const loadData = async () => {
        try {
          const [totemsData, receptionsData, pathsData] = await Promise.all([
            fetchTotems(campus),
            fetchReceptions(campus),
            fetchPaths(campus),
          ]);
          setTotems(totemsData);
          setReceptions(receptionsData);
          setPaths(pathsData);
          setError(null);
        } catch (error: any) {
          if (error.response?.status === 401) {
            const newToken = await refreshToken();
            if (newToken) {
              try {
                const [totemsData, receptionsData, pathsData] = await Promise.all([
                  fetchTotems(campus),
                  fetchReceptions(campus),
                  fetchPaths(campus),
                ]);
                setTotems(totemsData);
                setReceptions(receptionsData);
                setPaths(pathsData);
                setError(null);
                return;
              } catch (retryError) {
                console.error('Error fetching data after refresh:', retryError);
              }
            }
          }
          console.error('Error fetching data:', error);
          setError('No se pudieron cargar los datos del mapa. Por favor, intenta de nuevo.');
        }
      };
      loadData();
    }
  }, [isAuthenticated, role, campus]);

  useEffect(() => {
    const { src, error } = getMapaSrc(campus);
    if (error) {
      setSvgError(error);
    } else {
      setSvgError(null);
    }
  }, [campus]);

  const handlePointClick = async (point: TotemQR | ReceptionQR) => {
    setSelectedPoint(point);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoint(null);
    setImageFile(null);
  };

  const handleSavePoint = async (updatedPoint: TotemQR | ReceptionQR) => {
    if (!updatedPoint || !['admin', 'superuser'].includes(role as string)) return;

    try {
      let imageUrl = updatedPoint.imageUrl;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('totem_id', updatedPoint.id.toString());
        const response = await axios.post('http://localhost:8000/api/image-upload/', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')} `,
          },
        });
        imageUrl = response.data.imageUrl;
      }

      const pointData = { ...updatedPoint, imageUrl };
      const endpoint = 'campus' in pointData ? 'totems' : 'recepciones';
      const response = await axios.put(`http://localhost:8000/api/${endpoint}/${updatedPoint.id}/`, pointData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (endpoint === 'totems') {
        setTotems(totems.map(t => (t.id === updatedPoint.id ? response.data : t)));
      } else {
        setReceptions(receptions.map(r => (r.id === updatedPoint.id ? response.data : r)));
      }

      handleCloseModal();
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            let imageUrl = updatedPoint.imageUrl;
            if (imageFile) {
              const formData = new FormData();
              formData.append('file', imageFile);
              formData.append('totem_id', updatedPoint.id.toString());
              const response = await axios.post('http://localhost:8000/api/image-upload/', formData, {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              imageUrl = response.data.imageUrl;
            }

            const pointData = { ...updatedPoint, imageUrl };
            const endpoint = 'campus' in pointData ? 'totems' : 'recepciones';
            const response = await axios.put(`http://localhost:8000/api/${endpoint}/${updatedPoint.id}/`, pointData, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
            });

            if (endpoint === 'totems') {
              setTotems(totems.map(t => (t.id === updatedPoint.id ? response.data : t)));
            } else {
              setReceptions(receptions.map(r => (r.id === updatedPoint.id ? response.data : r)));
            }

            handleCloseModal();
            return;
          } catch (retryError) {
            console.error('Error saving point after refresh:', retryError);
          }
        }
      }
      console.error('Error saving point:', error);
      setError('No se pudo guardar el punto.');
    }
  };

  const handleDeletePoint = async (pointId: number, isTotem: boolean) => {
    if (!['admin', 'superuser'].includes(role as string)) return;

    try {
      const endpoint = isTotem ? 'totems' : 'recepciones';
      await axios.delete(`http://localhost:8000/api/${endpoint}/${pointId}/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (isTotem) {
        setTotems(totems.filter(t => t.id !== pointId));
      } else {
        setReceptions(receptions.filter(r => r.id !== pointId));
      }

      handleCloseModal();
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const endpoint = isTotem ? 'totems' : 'recepciones';
            await axios.delete(`http://localhost:8000/api/${endpoint}/${pointId}/`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            });

            if (isTotem) {
              setTotems(totems.filter(t => t.id !== pointId));
            } else {
              setReceptions(receptions.filter(r => r.id !== pointId));
            }

            handleCloseModal();
            return;
          } catch (retryError) {
            console.error('Error deleting point after refresh:', retryError);
          }
        }
      }
      console.error('Error deleting point:', error);
      setError('No se pudo eliminar el punto.');
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        if (!['admin', 'superuser'].includes(role as string)) return;
        const { lat, lng } = e.latlng;
        if (isCreatingPath) {
          setCurrentPathPoints([...currentPathPoints, [lat, lng]]);
        } else if (isCreatingTotem) {
          const newTotem: Omit<TotemQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Totem QR',
            description: '',
            imageUrl: '',
            campus: campus || '',
          };
          saveTotem(newTotem);
        } else if (isCreatingReception) {
          const newReception: Omit<ReceptionQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Espacio Seguro',
            description: '',
            imageUrl: '',
            campus: campus || '',
          };
          saveReception(newReception);
        }
      },
    });
    return null;
  };

  const saveTotem = async (totem: Omit<TotemQR, 'id'>) => {
    try {
      const response = await axios.post('http://localhost:8000/api/totems/', totem, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setTotems([...totems, response.data]);
      setIsCreatingTotem(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const response = await axios.post('http://localhost:8000/api/totems/', totem, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
            });
            setTotems([...totems, response.data]);
            setIsCreatingTotem(false);
            return;
          } catch (retryError) {
            console.error('Error creating totem after refresh:', retryError);
          }
        }
      }
      console.error('Error:', error);
      setError('No se pudo crear el tótem.');
    }
  };

  const saveReception = async (reception: Omit<ReceptionQR, 'id'>) => {
    try {
      const response = await axios.post('http://localhost:8000/api/recepciones/', reception, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setReceptions([...receptions, response.data]);
      setIsCreatingReception(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const response = await axios.post('http://localhost:8000/api/recepciones/', reception, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
            });
            setReceptions([...receptions, response.data]);
            setIsCreatingReception(false);
            return;
          } catch (retryError) {
            console.error('Error creating reception after refresh:', retryError);
          }
        }
      }
      console.error('Error:', error);
      setError('No se pudo crear la recepción.');
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
    if (!['admin', 'superuser'].includes(role as string)) return;
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
      campus: campus || '',
    };

    try {
      const response = await axios.post('http://localhost:8000/api/caminos/', pathData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setPaths([...paths, response.data]);
      setCurrentPathPoints([]);
      setIsCreatingPath(false);
      setIsConfirmModalOpen(false);
      setPathName('');
      alert('Camino guardado exitosamente.');
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const response = await axios.post('http://localhost:8000/api/caminos/', pathData, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
            });
            setPaths([...paths, response.data]);
            setCurrentPathPoints([]);
            setIsCreatingPath(false);
            setIsConfirmModalOpen(false);
            setPathName('');
            alert('Camino guardado exitosamente.');
            return;
          } catch (retryError) {
            console.error('Error saving path after refresh:', retryError);
          }
        }
      }
      console.error('Error:', error);
      setError('No se pudo guardar el camino.');
      setIsConfirmModalOpen(false);
      setPathName('');
    }
  };

  const toggleShowPaths = () => {
    setShowPaths(!showPaths);
  };

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
      campus: campus || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await axios.post('http://localhost:8000/api/denuncias/', { ...data, campus }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setSubmitted(true);
    } catch (error: any) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            await axios.post('http://localhost:8000/api/denuncias/', { ...data, campus }, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
            });
            setSubmitted(true);
            return;
          } catch (retryError) {
            console.error('Error submitting denuncia after refresh:', retryError);
          }
        }
      }
      console.error('Error enviando denuncia:', error);
      setError('No se pudo enviar la denuncia.');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <Typography>Validando sesión...</Typography>;
  }

  if (isAuthenticated === false) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/')}>
          Iniciar Sesión
        </Button>
      </Box>
    );
  }

  if (!role || !['admin', 'user', 'guest', 'superuser'].includes(role)) {
    return <Typography>Acceso denegado. Por favor, inicia sesión.</Typography>;
  }

  const { src: mapaSrc, error: mapaError } = getMapaSrc(campus);

  return (
    <Box className="openmap-container">
      {(error || svgError || mapaError) && (
        <Typography className="openmap-error">
          {error || svgError || mapaError}
        </Typography>
      )}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        className="openmap-tabs"
      >
        <Tab label="Mapa" />
        <Tab label="Denuncia" />
      </Tabs>

      {tabValue === 0 && (
        <Box className="openmap-map-container">
          {mapaSrc ? (
            <MapContainer
              className="openmap-map"
              zoom={18}
              maxZoom={22}
              minZoom={10}
              zoomControl={false}
            >
              {!isCreatingPath && <SetView bounds={svgBounds} zoom={18} />}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                opacity={0}
                maxZoom={19}
                minZoom={10}
              />
              {campus && (
                <ImageOverlay
                  url={mapaSrc}
                  bounds={svgBounds}
                  opacity={1}
                  eventHandlers={{
                    error: () => {
                      console.error('Error al cargar el archivo SVG');
                      setSvgError('No se pudo cargar el mapa del campus. Verifica que el archivo SVG sea válido.');
                    },
                  }}
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
              {showPaths &&
                paths.map(path => (
                  <Polyline key={path.id} positions={path.points.map(p => [p.latitude, p.longitude])} color="blue" weight={5} />
                ))}
              {selectedPath && (
                <Polyline positions={selectedPath.points.map(p => [p.latitude, p.longitude])} color="blue" weight={5} />
              )}
              <ZoomControl position="topright" />
            </MapContainer>
          ) : (
            <Box className="openmap-error">
              <Typography>No se encontró un mapa para el campus seleccionado.</Typography>
              <Button variant="contained" color="primary" onClick={() => navigate('/home')}>
                Volver a la página principal
              </Button>
            </Box>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box className="openmap-form-container">
          {submitted ? (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
              <Typography variant="h5">Denuncia Enviada</Typography>
              <Typography>Su denuncia ha sido recibida y será procesada a la brevedad.</Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setSubmitted(false);
                  form.reset();
                }}
                className="openmap-form-button"
              >
                Realizar otra denuncia
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={form.handleSubmit(onSubmit)} className="openmap-form">
              <Typography variant="h5" className="openmap-form-title">Formulario de Denuncia</Typography>
              <Typography>Complete el formulario para reportar un incidente relacionado con violencia o discriminación de género.</Typography>

              <Box className="openmap-form-section">
                <Typography variant="h6">Información Personal</Typography>
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
                  <Typography variant="body2">Si elige denuncia anónima, sus datos personales no serán visibles.</Typography>
                </FormControl>
              </Box>

              <Box className="openmap-form-section">
                <Typography variant="h6">Detalles del Incidente</Typography>
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
                    <Typography color="error">{form.formState.errors.tipoIncidente.message}</Typography>
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

              <Button type="submit" variant="contained" color="primary" className="openmap-form-button">
                Enviar Denuncia
              </Button>
            </Box>
          )}
        </Box>
      )}

      <Box className="openmap-buttons-container">
        <Tooltip title="Volver a la página principal">
          <Button
            onClick={handleGoHome}
            variant="contained"
            color="primary"
            className="openmap-button"
            aria-label="Volver a la página principal"
          >
            <HomeIcon />
          </Button>
        </Tooltip>
        {['admin', 'superuser'].includes(role as string) && (
          <>
            <Tooltip title={isCreatingPath ? 'Cancelar Crear Camino' : 'Crear Camino'}>
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
                variant="contained"
                color={isCreatingPath ? 'secondary' : 'primary'}
                className="openmap-button"
                aria-label={isCreatingPath ? 'Cancelar Crear Camino' : 'Crear Camino'}
              >
                {isCreatingPath ? <CancelIcon /> : <RouteIcon />}
              </Button>
            </Tooltip>

            {isCreatingPath && (
              <Tooltip title="Guardar Camino">
                <Button
                  onClick={savePath}
                  variant="contained"
                  color="success"
                  className="openmap-button"
                  aria-label="Guardar Camino"
                >
                  <SaveIcon />
                </Button>
              </Tooltip>
            )}

            <Tooltip title={isCreatingTotem ? 'Cancelar Crear Punto QR' : 'Crear Punto QR'}>
              <Button
                onClick={() => setIsCreatingTotem(!isCreatingTotem)}
                disabled={isCreatingPath || isCreatingReception}
                variant="contained"
                color={isCreatingTotem ? 'secondary' : 'primary'}
                className="openmap-button"
                aria-label={isCreatingTotem ? 'Cancelar Crear Punto QR' : 'Crear Punto QR'}
              >
                {isCreatingTotem ? <CancelIcon /> : <QrCodeIcon />}
              </Button>
            </Tooltip>

            <Tooltip title={isCreatingReception ? 'Cancelar Espacio Seguro' : 'Crear Espacio Seguro'}>
              <Button
                onClick={() => setIsCreatingReception(!isCreatingReception)}
                disabled={isCreatingPath || isCreatingTotem}
                variant="contained"
                color={isCreatingReception ? 'secondary' : 'primary'}
                className="openmap-button"
                aria-label={isCreatingReception ? 'Cancelar Espacio Seguro' : 'Crear Espacio Seguro'}
              >
                {isCreatingReception ? <CancelIcon /> : <ShieldIcon />}
              </Button>
            </Tooltip>
          </>
        )}

        <Tooltip title={showPaths ? 'Ocultar Caminos' : 'Mostrar Caminos'}>
          <Button
            onClick={toggleShowPaths}
            variant="contained"
            color={showPaths ? 'secondary' : 'primary'}
            className="openmap-button"
            aria-label={showPaths ? 'Ocultar Caminos' : 'Mostrar Caminos'}
          >
            {showPaths ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </Button>
        </Tooltip>
      </Box>

      <InfoPunto
        open={isModalOpen}
        punto={selectedPoint}
        role={role}
        onClose={handleCloseModal}
        onSave={handleSavePoint}
        onDelete={handleDeletePoint}
      />
    </Box>
  );
};

export default OpenMap;