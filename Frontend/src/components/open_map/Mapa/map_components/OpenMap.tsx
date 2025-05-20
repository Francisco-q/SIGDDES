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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPaths, fetchReceptions, fetchTotems } from '../../../../services/apiService';
import { Path, ReceptionQR, TotemQR } from '../../../../types/types';
import FormComponent from '../FormAcogida/FormComponent';
import InfoPunto from '../info_punto/InfoPunto';
import MapComponent from '../map_components/MapComponent';
import './OpenMap.css';

// Esquema de validación para el formulario de denuncia



const OpenMap: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});


  const campusSvgMap: Record<string, string> = {
    talca: '/assets/Talca.svg',
    curico: '/assets/Curico.svg',
    colchagua: '/assets/Colchagua.svg',
    pehuenche: '/assets/Pehuenche.svg',
    santiago: '/assets/Santiago.svg',
    linares: '/assets/Linares.svg',
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
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (warningModalOpen) {
      const timer = setTimeout(() => {
        setWarningModalOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [warningModalOpen]);

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
    try {
      let imageUrls = Array.isArray(updatedPoint.imageUrls) ? updatedPoint.imageUrls : [];
      if (imageFiles.length > 0) {
        const newImageUrls: string[] = [];
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('point_id', updatedPoint.id.toString());
          formData.append('point_type', isTotem ? 'totem' : 'reception');
          formData.append('campus', updatedPoint.campus);
          const response = await axios.post('http://localhost:8000/api/image-upload/', formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          newImageUrls.push(response.data.image);
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
      const response = await axios.put(`http://localhost:8000/api/${endpoint}/${updatedPoint.id}/`, pointData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

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

  const savePath = () => {
    if (currentPathPoints.length < 2) {
      setWarningMessage('El camino debe tener al menos dos puntos.');
      setWarningModalOpen(true);
      return;
    }

    const firstPoint = currentPathPoints[0];
    const lastPoint = currentPathPoints[currentPathPoints.length - 1];

    const isFirstPointTotem = totems.some(t =>
      Math.abs(t.latitude - firstPoint[0]) < 0.0001 && Math.abs(t.longitude - firstPoint[1]) < 0.0001
    );

    if (!isFirstPointTotem) {
      setWarningMessage('El camino debe comenzar en un Tótem QR.');
      setWarningModalOpen(true);
      return;
    }

    const isLastPointReception = receptions.some(r =>
      Math.abs(r.latitude - lastPoint[0]) < 0.0001 && Math.abs(r.longitude - lastPoint[1]) < 0.0001
    );

    if (!isLastPointReception) {
      setWarningMessage('El camino debe terminar en un Espacio Seguro (Recepción QR).');
      setWarningModalOpen(true);
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
        <Tab label="Entrevista" />
      </Tabs>

      {tabValue === 0 && (
        <Box className="openmap-map-container">
          {mapaSrc ? (
            <MapComponent
              campus={campus || ''}
              totems={totems}
              receptions={receptions}
              paths={paths}
              showPaths={showPaths}
              isCreatingPath={isCreatingPath}
              isCreatingTotem={isCreatingTotem}
              isCreatingReception={isCreatingReception}
              currentPathPoints={currentPathPoints}
              setCurrentPathPoints={setCurrentPathPoints}
              setSelectedPoint={setSelectedPoint}
              setIsModalOpen={setIsModalOpen}
              role={role}
              mapaSrc={mapaSrc}
              setWarningMessage={setWarningMessage}
              setWarningModalOpen={setWarningModalOpen}
            />
          ) : (
            <Box className="openmap-error">
              <Typography>No se encontró un mapa para el campus seleccionado.</Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/home')}
              >
                Volver a la página principal
              </Button>
            </Box>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box className="openmap-form-container">
          <FormComponent
            campus={campus}
            setSubmitted={setSubmitted}
            setFormErrors={setFormErrors}
            setError={setError}
          />
          {submitted && (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
              <Typography variant="h5">Entrevista de acogida enviada</Typography>
              <Button
                variant="contained"
                onClick={() => setSubmitted(false)}
                className="openmap-form-button"
              >
                Realizar otra entrevista
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
                disabled={pathName.trim().length < 3}
              >
                Guardar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={warningModalOpen} onClose={() => setWarningModalOpen(false)}>
        <DialogTitle>Advertencia</DialogTitle>
        <DialogContent>
          <Typography>{warningMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningModalOpen(false)} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OpenMap;