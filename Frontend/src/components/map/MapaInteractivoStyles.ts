import { CSSProperties } from 'react';

export const mapContainerStyle: CSSProperties = {
  width: '100%',
  height: '800px',
  position: 'relative',
  overflow: 'hidden',
};

export const svgContainerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,// Asegura que el contenedor SVG esté sobre el mapa
};

export const svgMapStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
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
};

export const menuButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
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
};