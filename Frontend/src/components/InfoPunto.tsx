import React, { useState } from 'react';

interface Punto {
  id: number;
  x: number;
  y: number;
  info: string;
}

interface InfoPuntoProps {
  punto: Punto;
  onClose: () => void;
  onSave: (info: string) => void;
  onDelete: () => void;
}

const InfoPunto: React.FC<InfoPuntoProps> = ({ punto, onClose, onSave, onDelete }) => {
  const [editando, setEditando] = useState(false);
  const [info, setInfo] = useState(punto.info);

  const handleEditClick = () => {
    setEditando(true);
  };

  const handleSaveClick = () => {
    onSave(info);
    setEditando(false);
  };

  return (
    <div className="info-punto-popup">
      <div className="info-punto-content">
        <button className="close-button" onClick={onClose}>x</button>
        <div className='data-punto'>
          <h2>Información del Punto</h2>
          <p>ID: {punto.id}</p>
          <p>Coordenadas: ({punto.x}, {punto.y})</p>

          {editando ? (
          <div>
            <label>
              Información:
              <input
                type="text"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
              />
            </label>
            <button onClick={handleSaveClick}>Guardar</button>
          </div>
        ) : (
          <p>Información: {punto.info}</p>
        )}
        {editando ? null : (
          <>
            <button onClick={handleEditClick}>Editar Punto</button>
            <button onClick={onDelete}>Eliminar Punto</button>
          </>
        )}
        </div>
        
        
      </div>
    </div>
  );
};

export default InfoPunto;