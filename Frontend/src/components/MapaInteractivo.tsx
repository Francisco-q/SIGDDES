import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import usePuntos from '../hooks/usePuntos';
import Home from './Home';
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
import '/src/styles/MapaInteractivo.css';

const MapaInteractivo: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();

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

  return (
    <>
      <Home />
      <div className="map-container">
        <button onClick={() => setModoAdmin(!modoAdmin)}>
          {modoAdmin ? 'Cambiar a Modo Usuario' : 'Cambiar a Modo Admin'}
        </button>
        {modoAdmin && (
          <>
            <button
              onClick={() =>
                activarCreacionPuntos(setTransform, setCrearPuntoActivo, setCrearPartidaActivo)
              }
            >
              Activar Creación de Puntos
            </button>
            <button
              onClick={() =>
                activarCreacionPartidas(setTransform, setCrearPartidaActivo, setCrearPuntoActivo)
              }
            >
              Activar Creación de Puntos de Partida
            </button>
          </>
        )}

        <div className="zoom-buttons">
          <button onClick={() => handleZoomIn(transform, setTransform)}>+</button>
          <button onClick={() => handleZoomOut(transform, setTransform)}>-</button>
        </div>

        <div
          className="svg-container"
          onMouseDown={(e) => handleMouseDown(e, setDragging, setStartCoords)}
          onMouseMove={(e) =>
            handleMouseMove(
              e,
              dragging,
              startCoords,
              setStartCoords,
              transform,
              setTransform
            )
          }
          onMouseUp={() => handleMouseUp(setDragging)}
        >
          <svg
            ref={svgRef}
            width="1000"
            height="800"
            className="svg-map"
            onClick={crearPuntoActivo ? handleCrearPunto : handleCrearPartida}
            style={{
              cursor: modoAdmin ? 'crosshair' : 'default',
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
                onClick={(e) => handleClickPuntoLocal(punto, e, setPuntoSeleccionado, setMostrandoInfo)}
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
                onClick={(e) => handleClickPuntoLocal(partida, e, setPuntoSeleccionado, setMostrandoInfo)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </svg>
        </div>

        {mostrandoInfo && puntoSeleccionado && (
          <InfoPunto
            punto={puntoSeleccionado}
            onClose={() => handleCloseInfo(setMostrandoInfo)}
            onSave={(info: string) => handleSaveEdit(handleEditarPunto, setMostrandoInfo, info)}
            onDelete={() => handleDeletePunto(handleEliminarPunto, setMostrandoInfo)}
          />
        )}
      </div>
    </>
  );
};

export default MapaInteractivo;