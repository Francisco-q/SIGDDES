import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button, ButtonGroup, IconButton, Menu, MenuItem } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePuntos from '../hooks/usePuntos';
import InfoPunto from './InfoPunto';
import {
  activarCreacionPartidas,
  activarCreacionPuntos,
  getMapaSrc,
  handleClickPuntoLocal,
  handleCloseInfo,
  handleDeletePunto,
  handleSaveEdit,
  handleZoomIn,
  handleZoomOut,
} from './mapaHelpers';
import {
  adminButtonsStyle,
  homeButtonStyle,
  mapContainerStyle,
  menuButtonStyle,
  svgContainerStyle,
  svgMapStyle,
  zoomButtonsStyle,
  mapImageStyle,
} from './MapaInteractivoStyles';

const MapaInteractivo: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();
  const navigate = useNavigate();

  if (!campus) {
    return <div>Error: Campus no definido</div>;
  }

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
    svgRef,
  } = usePuntos(campus);

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

  // Encontrar el último punto QR en la lista de puntos
  const ultimoPuntoQR = puntos.length > 0 ? puntos[puntos.length - 1] : null;

  // Estado inicial del transform sin zoom
  const initialTransform = {
    scale: 1, // Nivel de zoom inicial sin zoom
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

  return (
    <Box sx={mapContainerStyle}>
      <IconButton
        onClick={handleGoHome}
        sx={homeButtonStyle}
      >
        <HomeIcon />
      </IconButton>
      <IconButton
        onClick={handleMenuOpen}
        sx={menuButtonStyle}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem>
          <Button
            onClick={() => setModoAdmin(!modoAdmin)}
            variant="contained"
            sx={{ mb: 2 }}
          >
            {modoAdmin ? 'Cambiar a Modo Usuario' : 'Cambiar a Modo Admin'}
          </Button>
        </MenuItem>
        {modoAdmin && (
          <MenuItem>
            <ButtonGroup variant="contained" sx={{ mb: 2 }}>
              <Button
                onClick={() =>
                  activarCreacionPuntos(setTransform, setCrearPuntoActivo, setCrearPartidaActivo)
                }
              >
                Activar Creación de Puntos
              </Button>
              <Button
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

      <Box sx={zoomButtonsStyle}>
        <ButtonGroup variant="contained">
          <Button onClick={() => handleZoomIn(transform, setTransform)}>+</Button>
          <Button onClick={() => handleZoomOut(transform, setTransform)}>-</Button>
        </ButtonGroup>
      </Box>

      <Box
        sx={svgContainerStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Box
          component="svg"
          ref={svgRef}
          onClick={crearPuntoActivo ? handleCrearPunto : handleCrearPartida}
          sx={{
            ...svgMapStyle,
            cursor: modoAdmin ? 'pointer' : 'default',
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          }}
        >
          <Box component="image" href={getMapaSrc(campus)} sx={mapImageStyle} />
          {puntos.map((punto) => (
            <circle
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