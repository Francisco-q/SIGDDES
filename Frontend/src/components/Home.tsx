import { Box } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from './dashboard/Appsidebar';
import Dashboard from './dashboard/DashboardDenuncias';

const Home: React.FC = () => {
  const navigate = useNavigate();


  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar permanente */}
      <AppSidebar variant="permanent" />


      {/* Dashboard */}
      <Box sx={{ mt: 4, ml: 4, mr: 4, mb: 4, flexGrow: 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <Dashboard />
      </Box>
    </Box>
  );
};

export default Home;