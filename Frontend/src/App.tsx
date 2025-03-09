import { Container } from '@mui/material';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminCrud from './components/AdminCrud';
import Home from './components/Home';
import MapaInteractivo from './components/MapaInteractivo';

const App: React.FC = () => {
  return (
    <Router>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mapa/:campus" element={<MapaInteractivo />} />
          <Route path="/admin" element={<AdminCrud />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
