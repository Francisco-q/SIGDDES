import React, { useEffect, useState } from "react";
import '/src/styles/PuntoFormPopup.css'; // Importa estilos para el popup

const PuntoFormPopup = ({ punto, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    photoUrl: "",
  });

  useEffect(() => {
    if (punto) {
      setFormData({
        name: punto.name || "",
        description: punto.description || "",
        photoUrl: punto.photoUrl || "",
      });
    }
  }, [punto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); // Guardar la información del punto
    onClose(); // Cerrar el popup después de guardar
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>{punto ? "Editar Punto" : "Crear Punto"}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Descripción:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </label>
          <label>
            URL de la Foto:
            <input
              type="url"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </label>
          <button type="submit">Guardar</button>
        </form>
        <button className="close-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default PuntoFormPopup;
