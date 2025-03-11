import { SxProps, Theme } from '@mui/material';

export const mapContainerStyle: SxProps<Theme> = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  zIndex: 1,
  backgroundColor: 'gray',
};

export const svgContainerStyle: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: 'green',
  zIndex: 2,
};

export const svgMapStyle: SxProps<Theme> = {
  cursor: 'grab',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: 'white',
  '&:active': {
    cursor: 'grabbing',
  },
};

export const mapImageStyle: SxProps<Theme> = {
  width:"100%",
  height:"100%",
};
export const zoomButtonsStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '90%',
  left: '5%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(58,58,58,0.447)',
  borderRadius: '4px',
  zIndex: 3,
};

export const adminButtonsStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '10%',
  left: '20%',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 3,
};

export const homeButtonStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  zIndex: 4,
};

export const menuButtonStyle: SxProps<Theme> = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  zIndex: 4,
};

export const modoButtonStyle: SxProps<Theme> = {
  p: 2,
  position: 'absolute', 
  top: '80%', 
  left: '80%', 
  zIndex: 3 ,
};