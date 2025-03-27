interface Punto {
    id: number;
    x: number;
    y: number;
    info: string;
  }

export const getMapaSrc = (campus: string): string => {
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

export const handleZoomIn = (transform: any, setTransform: any) => {
  setTransform({ ...transform, scale: transform.scale * 1.1 });
};

export const handleZoomOut = (transform: any, setTransform: any) => {
  setTransform({ ...transform, scale: transform.scale * 0.9 });
};

export const handleMouseDown = (
  e: React.MouseEvent,
  setDragging: any,
  setStartCoords: any
) => {
  setDragging(true);
  setStartCoords({ x: e.clientX, y: e.clientY });
};

export const handleMouseMove = (
  e: React.MouseEvent,
  dragging: boolean,
  startCoords: any,
  setStartCoords: any,
  transform: any,
  setTransform: any
) => {
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

export const handleMouseUp = (setDragging: any) => {
  setDragging(false);
};

export const activarCreacionPuntos = (
  setTransform: any,
  setCrearPuntoActivo: any,
  setCrearPartidaActivo: any
) => {
  setTransform({ scale: 1, translateX: 0, translateY: 0 });
  setCrearPuntoActivo(true);
  setCrearPartidaActivo(false);
};

export const activarCreacionPartidas = (
  setTransform: any,
  setCrearPartidaActivo: any,
  setCrearPuntoActivo: any
) => {
  setTransform({ scale: 1, translateX: 0, translateY: 0 });
  setCrearPartidaActivo(true);
  setCrearPuntoActivo(false);
};

export const handleSaveEdit = (
  handleEditarPunto: any,
  setMostrandoInfo: any,
  info: string
) => {
  handleEditarPunto(info);
  setMostrandoInfo(false);
};

export const handleDeletePunto = (
  handleEliminarPunto: any,
  setMostrandoInfo: any
) => {
  handleEliminarPunto();
  setMostrandoInfo(false);
};

export const handleClickPuntoLocal = (
  punto: Punto,
  e: React.MouseEvent<SVGCircleElement, MouseEvent>,
  setPuntoSeleccionado: any,
  setMostrandoInfo: any
) => {
  e.stopPropagation();
  setPuntoSeleccionado(punto);
  setMostrandoInfo(true);
};

export const handleCloseInfo = (setMostrandoInfo: any) => {
  setMostrandoInfo(false);
};