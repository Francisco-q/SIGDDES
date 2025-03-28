import { CSSProperties } from 'react';

export const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: '100vh',
  position: 'relative',
  overflow: 'hidden',
  zIndex: 1, // Asegura que el mapa esté detrás del contenedor SVG
};

export const svgContainerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 2, // Asegura que el contenedor SVG esté sobre el mapa
};

export const svgMapStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 3,
};

export const mapImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const homeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  zIndex: 10, // Asegúrate de que esté por encima de otros elementos
  backgroundColor: '#ffffff', // Asegúrate de que sea visible
  color: '#65558F',
};

export const menuButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  zIndex: 4,
};

export const adminButtonsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

export const zoomButtonsStyle: CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  zIndex: 3,
};