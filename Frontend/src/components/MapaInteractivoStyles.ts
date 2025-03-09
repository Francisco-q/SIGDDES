// MapaInteractivoStyles.ts
import { SxProps, Theme } from '@mui/material';

export const mapContainerStyle: SxProps<Theme> = {
  position: 'relative',
  pt: '10px',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
};

export const svgContainerStyle: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  position: 'relative',
};

export const svgMapStyle: SxProps<Theme> = {
  cursor: 'grab',
  maxWidth: 'none',
  maxHeight: 'none',
  '&:active': {
    cursor: 'grabbing',
  },
};

export const zoomButtonsStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  display: 'flex',
  flexDirection: 'column',
  width: '50px',
  p: '10px',
  backgroundColor: 'rgba(58,58,58,0.447)',
  borderRadius: '4px',
};

export const adminButtonsStyle: SxProps<Theme> = {
  position: 'absolute',
  bottom: '10px',
  left: '10px',
  display: 'flex',
  flexDirection: 'column',
};
