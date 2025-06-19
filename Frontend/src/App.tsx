import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Home from './components/dashboard/Home';
import Login from './components/login/Login';
import MapComponent from './components/open_map/map_components/OpenMap';
import axiosInstance from './services/axiosInstance';

const PrivateRoute: React.FC<{ role: string | null }> = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await axiosInstance.get('user/current_user/');
        setIsAuthenticated(true);
        setError(null);
      } catch (error: any) {
        console.error('Error validating token:', error);
        setIsAuthenticated(false);
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
    };
    validateToken();
  }, []);

  if (isAuthenticated === null) {
    return <Typography>Validando sesión...</Typography>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (isLoggedIn) {
        try {
          const response = await axiosInstance.get('user/current_user/');
          setRole(response.data.role);
          setError(null);
        } catch (error: any) {
          console.error('Error fetching user role:', error);
          handleLogout();
        }
      } else {
        setRole('guest'); // Default to guest role if not logged in
      }
      setLoading(false);
    };
    fetchUserRole();
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    setRole(null);
    setError(null);
  };

  if (loading) {
    return <Typography>Cargando...</Typography>;
  }

  return (
    <Router>
      <Box
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/mapa2/:campus" element={<MapComponent />} /> {/* Public route */}
          <Route element={<PrivateRoute role={role} />}>
            <Route path="/home" element={<Home onLogout={handleLogout} />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Router>
  );
};

export default App;