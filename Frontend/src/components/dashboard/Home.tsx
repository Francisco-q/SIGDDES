import { Box } from '@mui/material';
import React from 'react';
import AppSidebar from './AppSidebar';
import Dashboard from './DashboardDenuncias';

interface HomeProps {
  onLogout: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogout }) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar permanente */}
      <AppSidebar onLogout={onLogout} />

      {/* Dashboard */}
      <Box
        sx={{
          mt: 1,
          ml: 2,
          mr: 2,
          mb: 2,
          flexGrow: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Dashboard />
      </Box>
    </Box>
  );
};

export default Home;