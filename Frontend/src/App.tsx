import { Container } from '@mui/material';
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminCrud from './components/admin/AdminCrud';
import Home from './components/Home';
import MapComponent from './components/open_map/OpenMap';

const App: React.FC = () => {
  return (
    <Router>
      <Container fixed>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mapa2/:campus" element={<MapComponent />} />
          <Route path="/admin" element={<AdminCrud />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
