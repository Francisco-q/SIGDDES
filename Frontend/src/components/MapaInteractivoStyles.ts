import { SxProps, Theme } from '@mui/material';

export const mapContainerStyle: SxProps<Theme> = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  zIndex: 1,
};

export const svgContainerStyle: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  position: 'relative',
  zIndex: 2,
};

export const svgMapStyle: SxProps<Theme> = {
  cursor: 'grab',
  width: '100%',
  height: '100%',
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
  zIndex: 3,
};

export const adminButtonsStyle: SxProps<Theme> = {
  position: 'absolute',
  bottom: '10px',
  left: '10px',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 3,
};