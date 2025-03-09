import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectCampus = (campus: string) => {
    navigate(`/mapa/${campus}`);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 3,
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom>
        Gestor Administrativo
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Button variant="contained" onClick={() => handleSelectCampus('Talca')}>
          Campus Talca
        </Button>
        <Button variant="contained" onClick={() => handleSelectCampus('Curico')}>
          Campus Curicó
        </Button>
        <Button variant="contained" onClick={() => handleSelectCampus('Linares')}>
          Campus Linares
        </Button>
        <Button variant="contained" onClick={() => handleSelectCampus('Santiago')}>
          Campus Santiago
        </Button>
        <Button variant="contained" onClick={() => handleSelectCampus('Pehuenche')}>
          Campus Pehuenche
        </Button>
        <Button variant="contained" onClick={() => handleSelectCampus('Colchagua')}>
          Campus Colchagua
        </Button>
      </Box>
    </Box>
  );
};

export default Home;
