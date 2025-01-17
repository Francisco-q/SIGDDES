// filepath: /c:/Users/Francisco/Documents/SIGDDES/Frontend/src/App.tsx
import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminCrud from './components/AdminCrud';
import Home from './components/Home';
import MapaInteractivo from './components/MapaInteractivo';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mapa/:campus" element={<MapaInteractivo />} /> {/* Ruta dinámica */}
        <Route path="/admin" element={<AdminCrud />} />
      </Routes>
    </Router>
  );
};

export default App;