import { useState } from "react";

// Hook personalizado para manejar la lógica de los puntos
const usePuntos = (campus) => {
  // Estado que mantiene los puntos para cada campus
  const [puntosPorCampus, setPuntosPorCampus] = useState({
    Talca: [{ id: 1, x: 500, y: 480, info: "Punto 1: Zona Feliz" }],
    Curico: [],
    Linares: [],
    Colchagua: [],
    Pehuenche: [],
    Santiago: [],
  });

  const [puntoSeleccionado, setPuntoSeleccionado] = useState(null);

  // Función para crear un nuevo punto
  const handleCrearPunto = (e, modoAdmin) => {
    if (!modoAdmin) return; // Solo permite crear puntos si es admin

    const svg = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svg.left;
    const y = e.clientY - svg.top;

    const nuevoPunto = {
      id: puntosPorCampus[campus].length + 1,
      x,
      y,
      info: "Nuevo Punto",
    };

    // Actualizamos la lista de puntos para el campus actual
    setPuntosPorCampus((prevState) => ({
      ...prevState,
      [campus]: [...prevState[campus], nuevoPunto],
    }));
  };

  // Función para seleccionar un punto
  const handleClickPunto = (punto, e) => {
    e.stopPropagation(); // Evita que se cree otro punto al seleccionar uno
    setPuntoSeleccionado(punto);
  };

  // Función para editar la información del punto seleccionado
  const handleEditarPunto = () => {
    if (puntoSeleccionado) {
      const nuevaInfo = prompt(
        "Edita la información del punto:",
        puntoSeleccionado.info
      );
      if (nuevaInfo) {
        setPuntosPorCampus((prevState) => ({
          ...prevState,
          [campus]: prevState[campus].map((punto) =>
            punto.id === puntoSeleccionado.id
              ? { ...punto, info: nuevaInfo }
              : punto
          ),
        }));
        setPuntoSeleccionado(null);
      }
    }
  };

  // Función para eliminar un punto
  const handleEliminarPunto = () => {
    if (puntoSeleccionado) {
      setPuntosPorCampus((prevState) => ({
        ...prevState,
        [campus]: prevState[campus].filter(
          (punto) => punto.id !== puntoSeleccionado.id
        ),
      }));
      setPuntoSeleccionado(null);
    }
  };

  // Nueva función para obtener la lista de puntos y permitir la edición
  const setPuntos = (actualizarPuntos) => {
    setPuntosPorCampus((prevState) => ({
      ...prevState,
      [campus]: actualizarPuntos(prevState[campus]),
    }));
  };

  return {
    puntos: puntosPorCampus[campus], // Devolvemos los puntos correspondientes al campus actual
    puntoSeleccionado,
    handleCrearPunto,
    handleClickPunto,
    handleEditarPunto,
    handleEliminarPunto,
    setPuntos, // Agrega esta línea para exportar la función de actualización
  };
};

export default usePuntos;
