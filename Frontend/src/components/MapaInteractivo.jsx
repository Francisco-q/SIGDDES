import React, { useRef, useState } from 'react';
import '/src/styles/MapaInteractivo.css';

const MapaInteractivo = () => {
  const [puntos, setPuntos] = useState([
    { id: 1, x: 500, y: 480, info: 'Punto 1: Zona Feliz' },
  ]);

  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);
  const [modoAdmin, setModoAdmin] = useState(true); // true si es administrador
  const svgRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const [dragging, setDragging] = useState(false);
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });

  // Función para manejar la creación de nuevos puntos
  const handleCrearPunto = (e) => {
    if (!modoAdmin) return; // No permitir crear puntos si no es admin

    const svg = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - svg.left - transform.translateX) / transform.scale;
    const y = (e.clientY - svg.top - transform.translateY) / transform.scale;

    const nuevoPunto = { id: puntos.length + 1, x, y, info: 'Nuevo Punto' };
    setPuntos([...puntos, nuevoPunto]);
  };

  // Función para seleccionar un punto al hacer clic
  const handleClickPunto = (punto, e) => {
    e.stopPropagation(); // Evita que el clic en el punto cree otro
    setPuntoSeleccionado(punto);
  };

  // Función para editar la información del punto seleccionado
  const handleEditarPunto = () => {
    if (puntoSeleccionado) {
      const nuevaInfo = prompt("Edita la información del punto:", puntoSeleccionado.info);
      if (nuevaInfo) {
        setPuntos(puntos.map((punto) =>
          punto.id === puntoSeleccionado.id ? { ...punto, info: nuevaInfo } : punto
        ));
        setPuntoSeleccionado(null);
      }
    }
  };

  // Función para eliminar el punto seleccionado
  const handleEliminarPunto = () => {
    if (puntoSeleccionado) {
      setPuntos(puntos.filter((punto) => punto.id !== puntoSeleccionado.id));
      setPuntoSeleccionado(null);
    }
  };

  // Función para manejar el zoom
  const handleZoom = (e) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? transform.scale * 0.9 : transform.scale * 1.1;
    setTransform({ ...transform, scale });
  };

  // Función para manejar el arrastre
  const handleMouseDown = (e) => {
    setDragging(true);
    setStartCoords({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
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

  return (
    <div className="map-container">
      <h1>{modoAdmin ? 'Admin' : 'Usuario'}</h1>
      <button onClick={() => setModoAdmin(!modoAdmin)}>
        {modoAdmin ? 'Cambiar a Modo Usuario' : 'Cambiar a Modo Admin'}
      </button>

      {/* Mapa SVG */}
      <div
        className="svg-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleZoom}
      >
        <svg
          ref={svgRef}
          width="1000"
          height="800"
          className="svg-map"
          onClick={handleCrearPunto} // Siempre permite crear puntos en modo admin
          style={{
            cursor: modoAdmin ? 'crosshair' : 'default',
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
          }}
        >
          <image href="/src/assets/Curico.svg" width="1000" height="800" />

          {/* Renderizar los puntos en el mapa */}
          {puntos.map((punto) => (
            <circle
              key={punto.id}
              cx={punto.x}
              cy={punto.y}
              r="10"
              fill="red"
              onClick={(e) => handleClickPunto(punto, e)} // Pasar el evento al manejador
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>
      </div>

      {/* Botones de administración (Crear, Editar, Eliminar) */}
      {modoAdmin && (
        <div className="admin-buttons">
          <button onClick={handleEditarPunto} disabled={!puntoSeleccionado}>Editar Punto</button>
          <button onClick={handleEliminarPunto} disabled={!puntoSeleccionado}>Eliminar Punto</button>
        </div>
      )}

      {/* Información del punto seleccionado (visible para cualquier usuario) */}
      {puntoSeleccionado && (
        <div className="info-popup">
          <p>{puntoSeleccionado.info}</p>
        </div>
      )}
    </div>
  );
};

export default MapaInteractivo;