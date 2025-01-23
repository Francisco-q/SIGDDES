import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectCampus = (campus: string) => {
    navigate(`/mapa/${campus}`); // Redirige a la ruta del mapa seleccionado
  };

  return (
    <div className="home-container">
      <h1>Gestor Administrativo</h1>
      <button onClick={() => handleSelectCampus('Talca')}>Campus Talca</button>
      <button onClick={() => handleSelectCampus('Curico')}>Campus Curicó</button>
      <button onClick={() => handleSelectCampus('Linares')}>Campus Linares</button>
      <button onClick={() => handleSelectCampus('Santiago')}>Campus Santiago</button>
      <button onClick={() => handleSelectCampus('Pehuenche')}>Campus Pehuenche</button>
      <button onClick={() => handleSelectCampus('Colchagua')}>Campus Colchagua</button>
    </div>
  );
};

export default Home;