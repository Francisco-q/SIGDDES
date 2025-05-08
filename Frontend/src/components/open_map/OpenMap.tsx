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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ImageOverlay, MapContainer, Marker, Polyline, TileLayer, useMapEvents, ZoomControl } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { fetchPaths, fetchReceptions, fetchTotems } from '../../services/apiService';
import { Path, ReceptionQR, TotemQR } from '../../types/types';
import InfoPunto from './InfoPunto';
import './OpenMap.css';
import SetView from './SetView';

// Definir íconos personalizados
const totemIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const receptionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Esquema de validación para el formulario de denuncia
const formSchema = z.object({
  nombre: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  apellido: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor ingrese un email válido.' }),
  telefono: z.string().min(8, { message: 'Por favor ingrese un número de teléfono válido.' }),
  tipo_incidente: z.string({ required_error: 'Por favor seleccione un tipo de incidente.' }),
  fecha_incidente: z.string({ required_error: 'Por favor ingrese la fecha del incidente.' }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe estar en formato YYYY-MM-DD.' }),
  lugar_incidente: z.string().min(2, { message: 'Por favor ingrese el lugar del incidente.' }),
  descripcion: z.string().min(10, { message: 'La descripción debe tener al menos 10 caracteres.' }),
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const svgBounds: [[number, number], [number, number]] = [
    [51.505, -0.09],
    [51.51, -0.1],
  ];

  const campusSvgMap: Record<string, string> = {
    talca: '/assets/Talca.svg',
    curico: '/assets/Curico.svg',
    colchagua: '/assets/Colchagua.svg',
    pehuenche: '/assets/Pehuenche.svg',
    santiago: '/assets/Santiago.svg',
  };

  const getMapaSrc = (campus: string | undefined) => {
    if (!campus) {
      return { src: '', error: 'No se especificó un campus.' };
    }
    const campusLower = campus.toLowerCase();
    const src = campusSvgMap[campusLower];
    if (!src) {
      return { src: '', error: `No se encontró un mapa para el campus ${campus}.` };
    }
    return { src, error: null };
  };

  const [totems, setTotems] = useState<TotemQR[]>([]);
  const [receptions, setReceptions] = useState<ReceptionQR[]>([]);
  const [paths, setPaths] = useState<Path[]>([]);
  const [showPaths, setShowPaths] = useState(false);
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [isCreatingTotem, setIsCreatingTotem] = useState(false);
  const [isCreatingReception, setIsCreatingReception] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<TotemQR | ReceptionQR | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pathName, setPathName] = useState('');
  const [pathSaved, setPathSaved] = useState(false);
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
          headers: { Authorization: `Bearer ${accessToken}` },
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
                headers: { Authorization: `Bearer ${newToken}` },
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

  useEffect(() => {
    if (isCreatingPath && currentPathPoints.length > 1) {
      if (!hasSafeSpace) {
        setError('El camino debe conectarse a un Espacio Seguro antes de guardarlo.');
      } else {
        setError(null);
      }
    }
  }, [currentPathPoints, isCreatingPath, receptions]);

  const handlePointClick = async (point: TotemQR | ReceptionQR) => {
    setSelectedPoint(point);
    setImageFiles([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoint(null);
    setImageFiles([]);
  };

  const handleSavePoint = async (updatedPoint: TotemQR | ReceptionQR) => {
    if (!updatedPoint || !['admin', 'superuser'].includes(role as string)) return;

    if (!updatedPoint.name || updatedPoint.name.trim().length < 2) {
      setError('El nombre del punto es requerido y debe tener al menos 2 caracteres.');
      return;
    }
    if (!updatedPoint.campus) {
      setError('El campus es requerido.');
      return;
    }
    if (typeof updatedPoint.latitude !== 'number' || typeof updatedPoint.longitude !== 'number') {
      setError('Las coordenadas (latitud y longitud) son requeridas.');
      return;
    }

    const isTotem = !('schedule' in updatedPoint);
    console.log('handleSavePoint - Guardando punto:', { isTotem, updatedPoint, imageFiles });

    try {
      let imageUrls = Array.isArray(updatedPoint.imageUrls) ? updatedPoint.imageUrls : [];
      if (imageFiles.length > 0) {
        const newImageUrls: string[] = [];
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file); // Campo para el archivo
          formData.append('point_id', updatedPoint.id.toString()); // Corregido de totem_id a point_id
          formData.append('point_type', isTotem ? 'totem' : 'reception'); // Tipo de punto
          formData.append('campus', updatedPoint.campus); // Campus
          console.log('Enviando solicitud a /api/image-upload/ con:', {
            file: file.name,
            point_id: updatedPoint.id,
            point_type: isTotem ? 'totem' : 'reception',
            campus: updatedPoint.campus,
          });
          const response = await axios.post('http://localhost:8000/api/image-upload/', formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'multipart/form-data', // Añadido
            },
          });
          console.log('Respuesta de /api/image-upload/:', response.data);
          newImageUrls.push(response.data.image); // Ajustado a response.data.image según el serializador
        }
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      const pointData = {
        ...updatedPoint,
        imageUrls,
        description: updatedPoint.description || '',
        status: updatedPoint.status || 'Operativo',
        ...(isTotem ? {} : { schedule: (updatedPoint as ReceptionQR).schedule || '' }),
      };

      const endpoint = isTotem ? 'totems' : 'recepciones';
      console.log('Enviando a endpoint:', endpoint, 'Datos:', pointData);

      const response = await axios.put(`http://localhost:8000/api/${endpoint}/${updatedPoint.id}/`, pointData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      console.log('Respuesta del backend:', response.data);

      if (isTotem) {
        setTotems(totems.map(t => (t.id === updatedPoint.id ? response.data as TotemQR : t)));
      } else {
        setReceptions(receptions.map(r => (r.id === updatedPoint.id ? response.data as ReceptionQR : r)));
      }

      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving point:', error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.detail || Object.values(error.response?.data || {}).join(' ') || 'No se pudo guardar el punto.';
      setError(errorMessage);
    }
  };

  const handleDeletePoint = async (pointId: number, isTotem: boolean) => {
    if (!['admin', 'superuser'].includes(role as string)) return;

    try {
      const endpoint = isTotem ? 'totems' : 'recepciones';
      console.log('Eliminando punto:', { pointId, endpoint });
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
            setError('Error al eliminar el punto tras reautenticación.');
          }
        }
      } else if (error.response?.status === 404) {
        if (isTotem) {
          setTotems(totems.filter(t => t.id !== pointId));
        } else {
          setReceptions(receptions.filter(r => r.id !== pointId));
        }
        handleCloseModal();
        return;
      }
      console.error('Error deleting point:', error);
      const errorMessage = error.response?.data?.detail || 'No se pudo eliminar el punto.';
      setError(errorMessage);
    }
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        if (!['admin', 'superuser'].includes(role as string)) return;
        if (isCreatingPath) {
          const { lat, lng } = e.latlng;
          if (currentPathPoints.length === 0) {
            const totem = totems.find(t =>
              Math.abs(t.latitude - lat) < 0.0001 && Math.abs(t.longitude - lng) < 0.0001
            );
            if (!totem) {
              setError('El camino debe comenzar desde un Totem QR.');
              return;
            }
          }
          setCurrentPathPoints(prev => [...prev, [lat, lng]]);
        } else if (isCreatingTotem) {
          const { lat, lng } = e.latlng;
          const newTotem: Omit<TotemQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Totem QR',
            description: '',
            imageUrls: [],
            campus: campus || '',
            status: 'Operativo',
          };
          saveTotem(newTotem);
        } else if (isCreatingReception) {
          const { lat, lng } = e.latlng;
          const newReception: Omit<ReceptionQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Espacio Seguro',
            description: '',
            imageUrls: [],
            campus: campus || '',
            schedule: '',
            status: 'Operativo',
          };
          saveReception(newReception);
        }
      },
    });
    return null;
  };

  const saveTotem = async (totem: Omit<TotemQR, 'id'>) => {
    try {
      console.log('Creando tótem:', totem);
      const response = await axios.post('http://localhost:8000/api/totems/', totem, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setTotems([...totems, response.data as TotemQR]);
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
            setTotems([...totems, response.data as TotemQR]);
            setIsCreatingTotem(false);
            return;
          } catch (retryError) {
            console.error('Error creating totem after refresh:', retryError);
            setError('Error al crear el tótem tras reautenticación.');
          }
        }
      }
      console.error('Error creating totem:', error);
      const errorMessage = error.response?.data?.detail || Object.values(error.response?.data || {}).join(' ') || 'No se pudo crear el tótem.';
      setError(errorMessage);
    }
  };

  const saveReception = async (reception: Omit<ReceptionQR, 'id'>) => {
    try {
      console.log('Creando recepción:', reception);
      const response = await axios.post('http://localhost:8000/api/recepciones/', reception, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      setReceptions([...receptions, response.data as ReceptionQR]);
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
            setReceptions([...receptions, response.data as ReceptionQR]);
            setIsCreatingReception(false);
            return;
          } catch (retryError) {
            console.error('Error creating reception after refresh:', retryError);
            setError('Error al crear la recepción tras reautenticación.');
          }
        }
      }
      console.error('Error creating reception:', error);
      const errorMessage = error.response?.data?.detail || Object.values(error.response?.data || {}).join(' ') || 'No se pudo crear la recepción.';
      setError(errorMessage);
    }
  };

  const otherPoints = currentPathPoints.slice(1);
  const hasSafeSpace = otherPoints.some((point: [number, number]) =>
    receptions.some(r =>
      Math.abs(r.latitude - point[0]) < 0.0001 && Math.abs(r.longitude - point[1]) < 0.0001
    )
  );

  const savePath = async () => {
    if (currentPathPoints.length < 2) {
      setError('El camino debe tener al menos dos puntos.');
      return;
    }
    setIsConfirmModalOpen(true);
    setPathSaved(false);
  };

  const confirmSavePath = async () => {
    if (!['admin', 'superuser'].includes(role as string)) {
      setError('Solo administradores pueden guardar caminos.');
      setIsConfirmModalOpen(false);
      return;
    }
    const trimmedName = pathName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError('Por favor, ingresa un nombre válido para el camino (mínimo 3 caracteres).');
      return;
    }
    if (currentPathPoints.length < 2) {
      setError('El camino debe tener al menos dos puntos.');
      setIsConfirmModalOpen(false);
      return;
    }
    if (!hasSafeSpace) {
      setError('El camino debe conectarse al menos con un Espacio Seguro.');
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
      setPaths((prev: Path[]) => [...prev, response.data as Path]);
      setCurrentPathPoints([]);
      setIsCreatingPath(false);
      setPathSaved(true);
      setPathName('');
    } catch (error: any) {
      console.error('Error saving path:', error);
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
            setPaths(prev => [...prev, response.data as Path]);
            setCurrentPathPoints([]);
            setIsCreatingPath(false);
            setPathSaved(true);
            setPathName('');
            return;
          } catch (retryError) {
            console.error('Error saving path after refresh:', retryError);
            setError('Error al guardar el camino tras reautenticación.');
          }
        } else {
          setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      } else {
        const errorMessage = error.response?.data?.detail || Object.values(error.response?.data || {}).join(' ') || 'No se pudo guardar el camino.';
        setError(errorMessage);
      }
      setIsConfirmModalOpen(false);
      setPathName('');
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setPathName('');
    setPathSaved(false);
    setCurrentPathPoints([]);
  };

  const handleCreateAnotherPath = () => {
    setPathSaved(false);
    setPathName('');
    setCurrentPathPoints([]);
    setIsCreatingPath(true);
    setIsConfirmModalOpen(false);
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
      tipo_incidente: '',
      fecha_incidente: '',
      lugar_incidente: '',
      descripcion: '',
      campus: campus || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setFormErrors({});
    try {
      console.log('Datos enviados:', data);
      const response = await axios.post('http://localhost:8000/api/denuncias/', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      console.log('Respuesta del servidor:', response.data);
      setSubmitted(true);
    } catch (error: any) {
      if (error.response) {
        const serverErrors = error.response.data;
        console.error('Errores del servidor:', serverErrors);
        if (serverErrors && typeof serverErrors === 'object') {
          setFormErrors(serverErrors);
        } else {
          setError('Error al enviar la denuncia: ' + error.response.data.detail);
        }
      } else {
        setError('Error al enviar la denuncia: ' + error.message);
      }
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
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
                  icon={totemIcon}
                  interactive={!isCreatingPath}
                  eventHandlers={{ click: () => !isCreatingPath && handlePointClick(totem) }}
                >
                </Marker>
              ))}
              {receptions.map(reception => (
                <Marker
                  key={reception.id}
                  position={[reception.latitude, reception.longitude]}
                  icon={receptionIcon}
                  interactive={!isCreatingPath}
                  eventHandlers={{ click: () => !isCreatingPath && handlePointClick(reception) }}
                >
                </Marker>
              ))}
              {currentPathPoints.length > 1 && <Polyline positions={currentPathPoints} color="red" weight={5} />}
              {showPaths &&
                paths.map(path => (
                  <Polyline key={path.id} positions={path.points.map(p => [p.latitude, p.longitude])} color="blue" weight={5} />
                ))}
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
                  error={!!form.formState.errors.nombre || !!formErrors.nombre}
                  helperText={form.formState.errors.nombre?.message || formErrors.nombre}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label="Apellido"
                  {...form.register('apellido')}
                  error={!!form.formState.errors.apellido || !!formErrors.apellido}
                  helperText={form.formState.errors.apellido?.message || formErrors.apellido}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label="Correo Electrónico"
                  type="email"
                  {...form.register('email')}
                  error={!!form.formState.errors.email || !!formErrors.email}
                  helperText={form.formState.errors.email?.message || formErrors.email}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label="Teléfono"
                  {...form.register('telefono')}
                  error={!!form.formState.errors.telefono || !!formErrors.telefono}
                  helperText={form.formState.errors.telefono?.message || formErrors.telefono}
                  fullWidth
                  margin="normal"
                  required
                />
              </Box>

              <Box className="openmap-form-section">
                <Typography variant="h6">Detalles del Incidente</Typography>
                <FormControl fullWidth margin="normal" error={!!form.formState.errors.tipo_incidente || !!formErrors.tipo_incidente}>
                  <InputLabel>Tipo de Incidente</InputLabel>
                  <Select
                    {...form.register('tipo_incidente')}
                    value={form.watch('tipo_incidente')}
                    onChange={(e) => form.setValue('tipo_incidente', e.target.value as string)}
                  >
                    <MenuItem value="">Seleccione el tipo de incidente</MenuItem>
                    <MenuItem value="acoso_sexual">Acoso Sexual</MenuItem>
                    <MenuItem value="violencia_fisica">Violencia Física</MenuItem>
                    <MenuItem value="violencia_psicologica">Violencia Psicológica</MenuItem>
                    <MenuItem value="discriminacion">Discriminación de Género</MenuItem>
                    <MenuItem value="acoso_laboral">Acoso Laboral</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </Select>
                  {(form.formState.errors.tipo_incidente || formErrors.tipo_incidente) && (
                    <Typography color="error">{form.formState.errors.tipo_incidente?.message || formErrors.tipo_incidente}</Typography>
                  )}
                </FormControl>
                <TextField
                  label="Fecha del Incidente"
                  type="date"
                  {...form.register('fecha_incidente')}
                  error={!!form.formState.errors.fecha_incidente || !!formErrors.fecha_incidente}
                  helperText={form.formState.errors.fecha_incidente?.message || formErrors.fecha_incidente}
                  fullWidth
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  label="Lugar del Incidente"
                  {...form.register('lugar_incidente')}
                  error={!!form.formState.errors.lugar_incidente || !!formErrors.lugar_incidente}
                  helperText={form.formState.errors.lugar_incidente?.message || formErrors.lugar_incidente}
                  fullWidth
                  margin="normal"
                  required
                />
                <TextField
                  label="Descripción del Incidente"
                  multiline
                  rows={4}
                  {...form.register('descripcion')}
                  error={!!form.formState.errors.descripcion || !!formErrors.descripcion}
                  helperText={form.formState.errors.descripcion?.message || formErrors.descripcion || 'Incluya todos los detalles relevantes.'}
                  fullWidth
                  margin="normal"
                  required
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
        setImageFiles={setImageFiles}
      />

      <Dialog open={isConfirmModalOpen} onClose={handleCloseConfirmModal}>
        <DialogTitle>{pathSaved ? 'Camino Guardado' : 'Guardar Camino'}</DialogTitle>
        <DialogContent>
          {pathSaved ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" color="success.main">
                ¡Camino guardado exitosamente!
              </Typography>
              <Typography>
                El camino "{pathName || 'Nuevo Camino'}" ha sido creado y añadido al mapa.
              </Typography>
            </Box>
          ) : (
            <TextField
              fullWidth
              label="Nombre del Camino"
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              margin="normal"
              required
              error={pathName.trim().length > 0 && pathName.trim().length < 3}
              helperText={
                pathName.trim().length > 0 && pathName.trim().length < 3
                  ? 'El nombre debe tener al menos 3 caracteres.'
                  : ''
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          {pathSaved ? (
            <>
              <Button onClick={handleCloseConfirmModal} color="primary">
                Cerrar
              </Button>
              <Button onClick={handleCreateAnotherPath} color="primary" variant="contained">
                Crear Otro Camino
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCloseConfirmModal} color="secondary">
                Cancelar
              </Button>
              <Button
                onClick={confirmSavePath}
                color="primary"
                disabled={pathName.trim().length < 3 || currentPathPoints.length < 2 || !hasSafeSpace}
              >
                Guardar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OpenMap;