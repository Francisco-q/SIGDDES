// InfoPuntoStyles.ts
import { SxProps, Theme } from '@mui/material';

export const drawerPaperStyle: SxProps<Theme> = {
  width: { xs: '80vw', sm: 400 },
  height: '95%',
  backgroundColor: 'white',
  borderRadius: '8px 0 0 8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  p: 2,
};

export const headerStyle: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'flex-end',
};

export const contentStyle: SxProps<Theme> = {
  flexGrow: 1,
  overflowY: 'auto',
  mt: 2,
};

export const actionsStyle: SxProps<Theme> = {
  mt: 2,
  display: 'flex',
  justifyContent: 'space-between',
};
