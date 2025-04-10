import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminCrud from './components/admin/AdminCrud';
import Home from './components/Home';
import MapComponent from './components/open_map/OpenMap';

const App: React.FC = () => {
  return (

    <Router>
      <main style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mapa2/:campus" element={<MapComponent />} />
          <Route path="/admin" element={<AdminCrud />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
