import HomeIcon from '@mui/icons-material/Home';
import { Box, Button, ButtonGroup, IconButton } from '@mui/material';
import React, { useState } from 'react';
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
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleSaveEdit,
  handleZoomIn,
  handleZoomOut,
} from './mapaHelpers';
import {
  adminButtonsStyle,
  mapContainerStyle,
  svgContainerStyle,
  svgMapStyle,
  zoomButtonsStyle
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
    transform,
    setTransform,
  } = usePuntos(campus);

  const [dragging, setDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [mostrandoInfo, setMostrandoInfo] = useState(false);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <>
      <IconButton
        onClick={handleGoHome}
        sx={{ position: 'absolute', top: '10px', left: '10px', zIndex: 4 }}
      >
        <HomeIcon />
      </IconButton>
      <Box sx={mapContainerStyle}>
        <Box sx={{ p: 2 }}>
          <Button
            onClick={() => setModoAdmin(!modoAdmin)}
            variant="contained"
            sx={{ mb: 2 }}
          >
            {modoAdmin ? 'Cambiar a Modo Usuario' : 'Cambiar a Modo Admin'}
          </Button>

          {modoAdmin && (
            <Box sx={adminButtonsStyle}>
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
            </Box>
          )}
        </Box>

        <Box sx={zoomButtonsStyle}>
          <ButtonGroup variant="contained">
            <Button onClick={() => handleZoomIn(transform, setTransform)}>+</Button>
            <Button onClick={() => handleZoomOut(transform, setTransform)}>-</Button>
          </ButtonGroup>
        </Box>

        <Box
          sx={svgContainerStyle}
          onMouseDown={(e) => handleMouseDown(e, setDragging, setStartCoords)}
          onMouseMove={(e) =>
            handleMouseMove(e, dragging, startCoords, setStartCoords, transform, setTransform)
          }
          onMouseUp={() => handleMouseUp(setDragging)}
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
            <image href={getMapaSrc(campus)} width="1000" height="800" />
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
    </>
  );
};

export default MapaInteractivo;