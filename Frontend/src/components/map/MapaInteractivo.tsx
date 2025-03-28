import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button, ButtonGroup, IconButton, Menu, MenuItem } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePuntos from '../../hooks/usePuntos';
import InfoPunto from '../info_punto/InfoPunto';
import MapComponent from '../open_map/OpenMap';
import {
  activarCreacionPartidas,
  activarCreacionPuntos,
  handleClickPuntoLocal,
  handleCloseInfo,
  handleDeletePunto,
  handleSaveEdit,
  handleZoomIn,
  handleZoomOut,
} from './mapaHelpers';
import {
  homeButtonStyle,
  mapContainerStyle,
  mapImageStyle,
  menuButtonStyle,
  svgContainerStyle,
  svgMapStyle,
  zoomButtonsStyle,
} from './MapaInteractivoStyles';

const MapaInteractivo: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);

  const {
    puntos,
    partidas,
    puntoSeleccionado,
    setPuntoSeleccionado,
    handleCrearPunto,
    handleCrearPartida,
    handleEditarPunto,
    handleEliminarPunto,
    modoAdmin,
    setModoAdmin,
    crearPuntoActivo,
    setCrearPuntoActivo,
    setCrearPartidaActivo,
  } = usePuntos(campus || '');

  const [dragging, setDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [mostrandoInfo, setMostrandoInfo] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const ultimoPuntoQR = puntos.length > 0 ? puntos[puntos.length - 1] : null;

  const initialTransform = {
    scale: 1,
    translateX: 0,
    translateY: 0,
  };

  const [transform, setTransform] = useState(initialTransform);

  useEffect(() => {
    if (ultimoPuntoQR) {
      const zoom = 2;
      const translateX = -ultimoPuntoQR.x * zoom + window.innerWidth / 2;
      const translateY = -ultimoPuntoQR.y * zoom + window.innerHeight / 2;
      setTransform({
        scale: zoom,
        translateX: translateX,
        translateY: translateY,
      });
    } else {
      setTransform(initialTransform);
    }
  }, [ultimoPuntoQR]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startCoords.x;
    const dy = e.clientY - startCoords.y;
    setStartCoords({ x: e.clientX, y: e.clientY });
    setTransform((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const getMapaSrc = (campus: string) => {
    return `/assets/${campus}.svg`; // Corregido: devolvemos la ruta directamente
  };

  if (!campus) {
    return <div id="mapa-interactivo-error">Error: Campus no definido</div>;
  }

  return (
    <Box id={`mapa-interactivo-container-${campus}`} sx={mapContainerStyle}>
      <IconButton
        id={`mapa-interactivo-home-button-${campus}`}
        onClick={handleGoHome}
        sx={homeButtonStyle}
      >
        <HomeIcon />
      </IconButton>
      <IconButton
        id={`mapa-interactivo-menu-button-${campus}`}
        onClick={handleMenuOpen}
        sx={menuButtonStyle}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id={`mapa-interactivo-menu-${campus}`}
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem id={`mapa-interactivo-menu-item-toggle-admin-${campus}`}>
          <Button
            id={`mapa-interactivo-toggle-admin-button-${campus}`}
            onClick={() => setModoAdmin(!modoAdmin)}
            variant="contained"
            sx={{ mb: 2 }}
          >
            {modoAdmin ? 'Cambiar a Modo Usuario' : 'Cambiar a Modo Admin'}
          </Button>
        </MenuItem>
        {modoAdmin && (
          <MenuItem id={`mapa-interactivo-menu-item-admin-actions-${campus}`}>
            <ButtonGroup
              id={`mapa-interactivo-admin-button-group-${campus}`}
              variant="contained"
              sx={{ mb: 2 }}
            >
              <Button
                id={`mapa-interactivo-create-points-button-${campus}`}
                onClick={() =>
                  activarCreacionPuntos(setTransform, setCrearPuntoActivo, setCrearPartidaActivo)
                }
              >
                Activar Creación de Puntos
              </Button>
              <Button
                id={`mapa-interactivo-create-starting-points-button-${campus}`}
                onClick={() =>
                  activarCreacionPartidas(setTransform, setCrearPartidaActivo, setCrearPuntoActivo)
                }
              >
                Activar Creación de Puntos de Partida
              </Button>
            </ButtonGroup>
          </MenuItem>
        )}
      </Menu>

      <Box id={`mapa-interactivo-zoom-buttons-${campus}`} sx={zoomButtonsStyle}>
        <ButtonGroup id={`mapa-interactivo-zoom-button-group-${campus}`} variant="contained">
          <Button
            id={`mapa-interactivo-zoom-in-button-${campus}`}
            onClick={() => handleZoomIn(transform, setTransform)}
          >
            +
          </Button>
          <Button
            id={`mapa-interactivo-zoom-out-button-${campus}`}
            onClick={() => handleZoomOut(transform, setTransform)}
          >
            -
          </Button>
        </ButtonGroup>
      </Box>

      <Box
        id={`mapa-interactivo-svg-container-${campus}`}
        sx={svgContainerStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <MapComponent />
        <Box
          id={`mapa-interactivo-svg-${campus}`}
          component="svg"
          ref={svgRef}
          onClick={crearPuntoActivo ? handleCrearPunto : handleCrearPartida}
          sx={{
            ...svgMapStyle,
            cursor: modoAdmin ? 'pointer' : 'default',
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 2,
          }}
        >
          <Box
            id={`mapa-interactivo-map-image-${campus}`}
            component="image"
            href={getMapaSrc(campus)}
            sx={mapImageStyle}
            onLoad={() => console.log('Mapa cargado correctamente')}
            onError={() => console.error('Error al cargar el mapa')}
          />
          {puntos.map((punto) => (
            <circle
              id={`mapa-interactivo-punto-${punto.id}`}
              key={punto.id}
              cx={punto.x}
              cy={punto.y}
              r="10"
              fill="red"
              onClick={(e) =>
                handleClickPuntoLocal(punto, e, setPuntoSeleccionado, setMostrandoInfo)
              }
              style={{ cursor: 'pointer' }}
            />
          ))}
          {partidas.map((partida) => (
            <circle
              id={`mapa-interactivo-partida-${partida.id}`}
              key={partida.id}
              cx={partida.x}
              cy={partida.y}
              r="10"
              fill="blue"
              onClick={(e) =>
                handleClickPuntoLocal(partida, e, setPuntoSeleccionado, setMostrandoInfo)
              }
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      {mostrandoInfo && puntoSeleccionado && (
        <InfoPunto
          id={`mapa-interactivo-info-punto-${puntoSeleccionado.id}`}
          punto={puntoSeleccionado}
          onClose={() => handleCloseInfo(setMostrandoInfo)}
          onSave={(info: string) =>
            handleSaveEdit(handleEditarPunto, setMostrandoInfo, info)
          }
          onDelete={() => handleDeletePunto(handleEliminarPunto, setMostrandoInfo)}
        />
      )}
    </Box>
  );
};

export default MapaInteractivo;