import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminCrud from './components/admin/AdminCrud';
import Home from './components/Home';
import Login from './components/login/Login';
import MapComponent from './components/open_map/OpenMap';

const PrivateRoute: React.FC<{ role: string | null }> = ({ role }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');
      const response = await axios.post('http://localhost:8000/api/token/refresh/', {
        refresh: refreshToken,
      });
      localStorage.setItem('access_token', response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await axios.get('http://localhost:8000/api/user/current_user/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setIsAuthenticated(true);
        setError(null);
      } catch (error: any) {
        if (error.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            try {
              await axios.get('http://localhost:8000/api/user/current_user/', {
                headers: { Authorization: `Bearer ${newToken}` },
              });
              setIsAuthenticated(true);
              setError(null);
              return;
            } catch (retryError) {
              console.error('Error validating token after refresh:', retryError);
            }
          }
        }
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
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        {error && <Typography color="error">{error}</Typography>}
        <Navigate to="/" replace />
      </Box>
    );
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
          const response = await axios.get('http://localhost:8000/api/user/current_user/', {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          });
          setRole(response.data.role);
          setError(null);
        } catch (error: any) {
          console.error('Error fetching user role:', error);
          setError('No se pudo verificar el rol del usuario. Usando rol por defecto (guest).');
          setRole('guest');
        }
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
        {isLoggedIn && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="secondary" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        )}
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />} />
          <Route element={<PrivateRoute role={role} />}>
            <Route path="/home" element={<Home />} />
            <Route path="/mapa2/:campus" element={<MapComponent />} />
            <Route
              path="/admin"
              element={role === 'admin' ? <AdminCrud /> : <Navigate to="/home" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Router>
  );
};

export default App;