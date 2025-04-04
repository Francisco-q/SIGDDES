import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField
} from '@mui/material';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { ImageOverlay, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import SetView from './SetView';

interface TotemQR {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
  imageUrl: string;
  campus: string; // Añadido
}

interface ReceptionQR {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
  imageUrl: string;
  campus: string; // Añadido
}

interface PathPoint {
  latitude: number;
  longitude: number;
  order: number;
}

interface Path {
  id: number;
  name: string;
  points: PathPoint[];
  campus: string;
}

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
  const [menuOpen, setMenuOpen] = useState(true);

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
      const endpoint = 'campus' in selectedPoint && selectedPoint.latitude ? 'totems' : 'recepciones';
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
      fetch(`http://localhost:8000/api/totems/?campus=${campus}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener totems');
          return res.json();
        })
        .then((data: TotemQR[]) => setTotems(data))
        .catch(error => console.error('Error fetching totems:', error));

      // Cargar recepciones específicas del campus
      fetch(`http://localhost:8000/api/recepciones/?campus=${campus}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener recepciones');
          return res.json();
        })
        .then((data: ReceptionQR[]) => setReceptions(data))
        .catch(error => console.error('Error fetching receptions:', error));

      // Cargar caminos específicos del campus
      fetch(`http://localhost:8000/api/caminos/?campus=${campus}`)
        .then(res => {
          if (!res.ok) throw new Error('Error al obtener caminos');
          return res.json();
        })
        .then((data: Path[]) => setPaths(data))
        .catch(error => console.error('Error fetching paths:', error));
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
            description: '',
            imageUrl: '',
            campus: campus || '', // Asociar al campus actual
          };
          saveTotem(newTotem);
          setIsCreatingTotem(false);
        } else if (isCreatingReception) {
          const newReception: Omit<ReceptionQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nueva Recepción QR',
            description: '',
            imageUrl: '',
            campus: campus || '', // Asociar al campus actual
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
    if (!trimmedName) {
      alert('Por favor, ingresa un nombre para el camino.');
      return;
    }
    if (trimmedName.length < 3) {
      alert('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (!campus) {
      alert('No se ha especificado un campus.');
      return;
    }

    const pathData = {
      name: trimmedName,
      points: currentPathPoints.map((point, index) => ({
        latitude: point[0],
        longitude: point[1],
        order: index + 1,
      })),
      campus: campus,
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

  return (
    <Box>
      <IconButton
        onClick={handleGoHome}
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          backgroundColor: 'white',
        }}
      >
        <HomeIcon />
      </IconButton>

      {menuOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: 'white',
            boxShadow: 3,
            borderRadius: 2,
            padding: 2,
            paddingTop: 4,
            width: '200px',
          }}
        >
          <IconButton
            onClick={() => setMenuOpen(false)}
            size="small"
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              zIndex: 1001,
              fontSize: '16px',
            }}
          >
            -
          </IconButton>
          <Button
            fullWidth
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
            sx={{ marginBottom: 1 }}
          >
            {isCreatingPath ? 'Cancelar Crear Camino' : 'Crear Camino'}
          </Button>
          {isCreatingPath && (
            <>
              <Button
                fullWidth
                onClick={savePath}
                variant="contained"
                color="success"
                sx={{ marginBottom: 1 }}
              >
                Finalizar Camino
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setIsCreatingPath(false);
                  setCurrentPathPoints([]);
                  setPathName('');
                }}
                variant="outlined"
                color="error"
                sx={{ marginBottom: 1 }}
              >
                Cancelar Camino
              </Button>
            </>
          )}
          <Button
            fullWidth
            onClick={() => {
              if (isCreatingTotem) {
                setIsCreatingTotem(false);
              } else {
                setIsCreatingTotem(true);
              }
            }}
            disabled={isCreatingPath || isCreatingReception}
            variant="contained"
            color={isCreatingTotem ? 'secondary' : 'primary'}
            sx={{ marginBottom: 1 }}
          >
            {isCreatingTotem ? 'Cancelar Crear Punto QR' : 'Crear Punto QR'}
          </Button>
          <Button
            fullWidth
            onClick={() => {
              if (isCreatingReception) {
                setIsCreatingReception(false);
              } else {
                setIsCreatingReception(true);
              }
            }}
            disabled={isCreatingPath || isCreatingTotem}
            variant="contained"
            color={isCreatingReception ? 'secondary' : 'primary'}
            sx={{ marginBottom: 1 }}
          >
            {isCreatingReception ? 'Cancelar Crear Recepción QR' : 'Crear Recepción QR'}
          </Button>
          <Button
            fullWidth
            onClick={toggleShowPaths}
            variant="contained"
            color={showPaths ? 'secondary' : 'primary'}
            sx={{ marginBottom: 1 }}
          >
            {showPaths ? 'Ocultar Caminos' : 'Mostrar Caminos'}
          </Button>
        </Box>
      )}
      {!menuOpen && (
        <IconButton
          onClick={() => setMenuOpen(true)}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            backgroundColor: 'white',
            boxShadow: 3,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <MapContainer
        style={{ height: '100vh', width: '100%' }}
        zoom={18}
        maxZoom={22}
        minZoom={10}
      >
        <SetView bounds={svgBounds} zoom={18} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          opacity={0.1}
          maxZoom={19}
          minZoom={10}
        />
        {campus && (
          <ImageOverlay
            url={getMapaSrc(campus)}
            bounds={svgBounds}
            opacity={1}
            eventHandlers={{
              error: () => console.error('Error al cargar el archivo SVG'),
            }}
          />
        )}
        <MapClickHandler />
        {totems.map(totem => (
          <Marker
            key={totem.id}
            position={[totem.latitude, totem.longitude]}
            interactive={!isCreatingPath}
            eventHandlers={{
              click: () => {
                if (!isCreatingPath) {
                  handlePointClick(totem);
                }
              },
            }}
          >
            <Popup>{totem.name}</Popup>
          </Marker>
        ))}
        {receptions.map(reception => (
          <Marker
            key={reception.id}
            position={[reception.latitude, reception.longitude]}
            interactive={!isCreatingPath}
            eventHandlers={{
              click: () => {
                if (!isCreatingPath) {
                  handlePointClick(reception);
                }
              },
            }}
          >
            <Popup>{reception.name}</Popup>
          </Marker>
        ))}
        {currentPathPoints.length > 1 && (
          <Polyline positions={currentPathPoints} color="red" />
        )}
        {showPaths &&
          paths.map(path => (
            <Polyline
              key={path.id}
              positions={path.points.map(p => [p.latitude, p.longitude])}
              color="blue"
            />
          ))}
        {selectedPath && (
          <Polyline positions={selectedPath.points.map(p => [p.latitude, p.longitude])} color="blue" />
        )}
      </MapContainer>
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
            <img
              src={selectedPoint.imageUrl}
              alt={selectedPoint.name}
              style={{ width: '100%', marginTop: '10px' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPathName('');
        }}
      >
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
          <Button
            onClick={() => {
              setIsConfirmModalOpen(false);
              setPathName('');
            }}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button onClick={confirmSavePath} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OpenMap;