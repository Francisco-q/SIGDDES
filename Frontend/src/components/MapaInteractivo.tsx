import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import usePuntos from '../hooks/usePuntos';
import InfoPunto from './InfoPunto';
import '/src/styles/MapaInteractivo.css';

const MapaInteractivo: React.FC = () => {
  const { campus } = useParams<{ campus: string }>();

  if (!campus) {
    return <div>Error: Campus no definido</div>;
  }

  const {
    puntos,
    puntoSeleccionado,
    setPuntoSeleccionado,
    handleCrearPunto,
    handleClickPunto,
    handleEditarPunto,
    handleEliminarPunto,
    modoAdmin,
    setModoAdmin,
    crearPuntoActivo,
    setCrearPuntoActivo,
    svgRef,
    transform,
    setTransform,
  } = usePuntos(campus);

  const [dragging, setDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [mostrandoInfo, setMostrandoInfo] = useState(false);

  const handleZoomIn = () => {
    setTransform({ ...transform, scale: transform.scale * 1.1 });
  };

  const handleZoomOut = () => {
    setTransform({ ...transform, scale: transform.scale * 0.9 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - startCoords.x;
    const dy = e.clientY - startCoords.y;
    setStartCoords({ x: e.clientX, y: e.clientY });
    setTransform({
      ...transform,
      translateX: transform.translateX + dx,
      translateY: transform.translateY + dy,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const activarCreacionPuntos = () => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    setCrearPuntoActivo(true);
  };

  const handleSaveEdit = (info: string) => {
    handleEditarPunto(info);
    setMostrandoInfo(false);
  };

  const handleDeletePunto = () => {
    handleEliminarPunto();
    setMostrandoInfo(false);
  };

  const handleClickPuntoLocal = (punto: Punto, e: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
    e.stopPropagation();
    setPuntoSeleccionado(punto);
    setMostrandoInfo(true);
  };

  const handleCloseInfo = () => {
    setMostrandoInfo(false);
  };

  const getMapaSrc = () => {
    switch (campus) {
      case 'Talca':
        return '/src/assets/Talca.svg';
      case 'Curico':
        return '/src/assets/Curico.svg';
      case 'Linares':
        return '/src/assets/Linares.svg';
      case 'Santiago':
        return '/src/assets/Santiago.svg';
      case 'Pehuenche':
        return '/src/assets/Pehuenche.svg';
      case 'Colchagua':
        return '/src/assets/Colchagua.svg';
      default:
        return '/src/assets/default.svg';
    }
  };

  return (
    <div className="map-container">
      <h1>{modoAdmin ? 'Admin' : 'Usuario'}</h1>
      <button onClick={() => setModoAdmin(!modoAdmin)}>
        {modoAdmin ? 'Cambiar a Modo Usuario' : 'Cambiar a Modo Admin'}
      </button>
      {modoAdmin && (
        <button onClick={activarCreacionPuntos}>
          Activar Creación de Puntos
        </button>
      )}

      <div className="zoom-buttons">
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleZoomOut}>-</button>
      </div>

      <div
        className="svg-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width="1000"
          height="800"
          className="svg-map"
          onClick={handleCrearPunto}
          style={{
            cursor: modoAdmin ? 'crosshair' : 'default',
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          }}
        >
          <image href={getMapaSrc()} width="1000" height="800" />

          {puntos.map((punto) => (
            <circle
              key={punto.id}
              cx={punto.x}
              cy={punto.y}
              r="10"
              fill="red"
              onClick={(e) => handleClickPuntoLocal(punto, e)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>
      </div>

      {mostrandoInfo && puntoSeleccionado && (
        <InfoPunto
          punto={puntoSeleccionado}
          onClose={handleCloseInfo}
          onSave={handleSaveEdit}
          onDelete={handleDeletePunto}
        />
      )}
    </div>
  );
};

export default MapaInteractivo;