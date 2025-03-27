// filepath: /c:/Users/Francisco/Documents/SIGDDES/Frontend/src/components/AdminCrud.tsx
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { Punto } from '../map/MapaInteractivo'; // Asegúrate de exportar la interfaz Punto desde MapaInteractivo
import '/src/styles/AdminCrud.css'; // Importa estilos para el componente

const AdminCrud: React.FC = () => {
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [puntoSeleccionado, setPuntoSeleccionado] = useState<Punto | null>(null);

  // Función para obtener los puntos del backend
  const fetchPuntos = async () => {
    try {
      const response = await axiosInstance.get('/puntos/');
      setPuntos(response.data);
    } catch (error) {
      console.error('Error fetching puntos:', error);
    }
  };

  useEffect(() => {
    fetchPuntos();
  }, []);

  // Función para crear un nuevo punto
  const handleCrearPunto = async () => {
    const nuevoPunto: Punto = { id: puntos.length + 1, x: 0, y: 0, info: 'Nuevo Punto' };
    try {
      const response = await axiosInstance.post('/puntos/', nuevoPunto);
      setPuntos([...puntos, response.data]);
    } catch (error) {
      console.error('Error creating punto:', error);
    }
  };

  // Función para editar un punto
  const handleEditarPunto = async (punto: Punto) => {
    const nuevaInfo = prompt("Edita la información del punto:", punto.info);
    if (nuevaInfo) {
      try {
        const response = await axiosInstance.put(`/puntos/${punto.id}/`, { ...punto, info: nuevaInfo });
        setPuntos(puntos.map((p) =>
          p.id === punto.id ? response.data : p
        ));
      } catch (error) {
        console.error('Error editing punto:', error);
      }
    }
  };

  // Función para eliminar un punto
  const handleEliminarPunto = async (punto: Punto) => {
    try {
      await axiosInstance.delete(`/puntos/${punto.id}/`);
      setPuntos(puntos.filter((p) => p.id !== punto.id));
    } catch (error) {
      console.error('Error deleting punto:', error);
    }
  };

  return (
    <div className="admin-crud">
      <h2>Administración de Puntos</h2>
      <button onClick={handleCrearPunto}>Crear Nuevo Punto</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Coordenada X</th>
            <th>Coordenada Y</th>
            <th>Información</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((punto) => (
            <tr key={punto.id}>
              <td>{punto.id}</td>
              <td>{punto.x}</td>
              <td>{punto.y}</td>
              <td>{punto.info}</td>
              <td>
                <button onClick={() => handleEditarPunto(punto)}>Editar</button>
                <button onClick={() => handleEliminarPunto(punto)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCrud;