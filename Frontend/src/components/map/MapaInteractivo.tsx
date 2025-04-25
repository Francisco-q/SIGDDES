import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { ImageOverlay, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import SetView from '../open_map/SetView';

interface TotemQR {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
}

interface ReceptionQR {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
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
}

const OpenMap: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();
  const navigate = useNavigate();

  const svgBounds: [[number, number], [number, number]] = [
    [51.505, -0.09], // Esquina superior izquierda
    [51.51, -0.1],   // Esquina inferior derecha
  ];

  const getMapaSrc = (campus: string | undefined) => {
    if (!campus) return '';
    return `/assets/${campus}.svg`;
  };

  // Estado para puntos QR, recepciones y caminos
  const [totems, setTotems] = useState<TotemQR[]>([]);
  const [receptions, setReceptions] = useState<ReceptionQR[]>([]);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);

  // Estado para crear caminos, puntos QR y recepciones QR
  const [isCreatingPath, setIsCreatingPath] = useState(false);
  const [isCreatingTotem, setIsCreatingTotem] = useState(false);
  const [isCreatingReception, setIsCreatingReception] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<[number, number][]>([]);

  // Estado para el menú
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Cargar puntos QR y recepciones desde el backend
  useEffect(() => {
    fetch('http://localhost:8000/api/totems/')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener totems');
        return res.json();
      })
      .then((data: TotemQR[]) => setTotems(data))
      .catch(error => console.error('Error fetching totems:', error));

    fetch('http://localhost:8000/api/recepciones/')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener recepciones');
        return res.json();
      })
      .then((data: ReceptionQR[]) => setReceptions(data))
      .catch(error => console.error('Error fetching receptions:', error));
  }, []);

  // Manejar clics en el mapa para agregar puntos
  const MapClickHandler: React.FC = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;

        if (isCreatingPath) {
          // Agregar puntos al camino actual
          setCurrentPathPoints([...currentPathPoints, [lat, lng]]);
        } else if (isCreatingTotem) {
          // Crear un nuevo punto QR
          const newTotem: Omit<TotemQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nuevo Totem QR',
          };
          saveTotem(newTotem);
        } else if (isCreatingReception) {
          // Crear una nueva recepción QR
          const newReception: Omit<ReceptionQR, 'id'> = {
            latitude: lat,
            longitude: lng,
            name: 'Nueva Recepción QR',
          };
          saveReception(newReception);
        }
      },
    });
    return null;
  };

  // Guardar un nuevo punto QR en el backend
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
      setIsCreatingTotem(false); // Salir del modo de creación
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Guardar una nueva recepción QR en el backend
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
      setIsCreatingReception(false); // Salir del modo de creación
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Guardar el camino en el backend
  const savePath = async () => {
    const pathData = {
      name: 'Nuevo camino',
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
      setCurrentPathPoints([]); // Reinicia los puntos
      setIsCreatingPath(false); // Sale del modo de creación
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Box>
      {/* Botón Home */}
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

      {/* Botón para abrir el menú */}
      <IconButton
        onClick={handleMenuOpen}
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: 'white',
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Menú desplegable */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { setIsCreatingPath(!isCreatingPath); handleMenuClose(); }}>
          {isCreatingPath ? 'Cancelar Crear Camino' : 'Crear Camino'}
        </MenuItem>
        <MenuItem onClick={() => { setIsCreatingTotem(!isCreatingTotem); handleMenuClose(); }}>
          {isCreatingTotem ? 'Cancelar Crear Punto QR' : 'Crear Punto QR'}
        </MenuItem>
        <MenuItem onClick={() => { setIsCreatingReception(!isCreatingReception); handleMenuClose(); }}>
          {isCreatingReception ? 'Cancelar Crear Recepción QR' : 'Crear Recepción QR'}
        </MenuItem>
      </Menu>

      <MapContainer style={{ height: '100vh', width: '100%' }}>
        <SetView bounds={svgBounds} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          opacity={0.1} // Reduce la opacidad del mapa base
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
        {/* Renderizar puntos QR */}
        {totems.map(totem => (
          <Marker key={totem.id} position={[totem.latitude, totem.longitude]}>
          </Marker>
        ))}
        {/* Renderizar recepciones */}
        {receptions.map(reception => (
          <Marker key={reception.id} position={[reception.latitude, reception.longitude]}>
            <Popup>{reception.name}</Popup>
          </Marker>
        ))}
        {/* Dibuja el camino actual mientras se está creando */}
        {currentPathPoints.length > 1 && (
          <Polyline positions={currentPathPoints} color="red" />
        )}
        {/* Renderizar camino seleccionado */}
        {selectedPath && (
          <Polyline positions={selectedPath.points.map(p => [p.latitude, p.longitude])} color="blue" />
        )}
      </MapContainer>
    </Box>
  );
};

export default OpenMap;