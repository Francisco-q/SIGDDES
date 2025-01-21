import { useRef, useState } from "react";

interface Punto {
  id: number;
  x: number;
  y: number;
  info: string;
}

const usePuntos = (campus: string) => {
  // Estado que mantiene los puntos para cada campus
  const [puntosPorCampus, setPuntosPorCampus] = useState<{ [key: string]: Punto[] }>({
    Talca: [{ id: 1, x: 500, y: 480, info: "Punto 1: Zona Feliz" }],
    Curico: [],
    Linares: [],
    Colchagua: [],
    Pehuenche: [],
    Santiago: [],
  });

  const [puntoSeleccionado, setPuntoSeleccionado] = useState<Punto | null>(null);
  const [modoAdmin, setModoAdmin] = useState(true); // true si es administrador
  const [crearPuntoActivo, setCrearPuntoActivo] = useState(false); // Estado para controlar la creación de puntos
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });

  // Función para crear un nuevo punto
  const handleCrearPunto = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!modoAdmin || !crearPuntoActivo) return; // No permitir crear puntos si no es admin o si no está activo

    const svg = svgRef.current!.getBoundingClientRect();
    const x = (e.clientX - svg.left - transform.translateX) / transform.scale;
    const y = (e.clientY - svg.top - transform.translateY) / transform.scale;

    const nuevoPunto: Punto = { id: puntosPorCampus[campus].length + 1, x, y, info: 'Nuevo Punto' };

    // Actualizamos la lista de puntos para el campus actual
    setPuntosPorCampus((prevState) => ({
      ...prevState,
      [campus]: [...prevState[campus], nuevoPunto],
    }));
    setCrearPuntoActivo(false); // Desactivar la creación de puntos después de crear uno
  };

  // Función para seleccionar un punto
  const handleClickPunto = (punto: Punto, e: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
    e.stopPropagation(); // Evita que se cree otro punto al seleccionar uno
    setPuntoSeleccionado(punto);
  };

  // Función para editar la información del punto seleccionado
  const handleEditarPunto = (nuevaInfo: string) => {
    if (puntoSeleccionado) {
      setPuntosPorCampus((prevState) => ({
        ...prevState,
        [campus]: prevState[campus].map((punto) =>
          punto.id === puntoSeleccionado.id ? { ...punto, info: nuevaInfo } : punto
        ),
      }));
      setPuntoSeleccionado(null);
    }
  };

  // Función para eliminar un punto
  const handleEliminarPunto = () => {
    if (puntoSeleccionado) {
      setPuntosPorCampus((prevState) => ({
        ...prevState,
        [campus]: prevState[campus].filter((punto) => punto.id !== puntoSeleccionado.id),
      }));
      setPuntoSeleccionado(null);
    }
  };

  return {
    puntos: puntosPorCampus[campus], // Devolvemos los puntos correspondientes al campus actual
    puntoSeleccionado,
    setPuntoSeleccionado,
    handleCrearPunto,
    handleClickPunto,
    handleEditarPunto,
    handleEliminarPunto,
    modoAdmin,
    setModoAdmin,
    crearPuntoActivo,
    setCrearPuntoActivo,
    svgRef,
    transform,
    setTransform,
  };
};

export default usePuntos;