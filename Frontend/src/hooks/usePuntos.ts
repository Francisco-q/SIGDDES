import { useEffect, useRef, useState } from "react";

interface Punto {
  id: number;
  x: number;
  y: number;
  info: string;
  campus: string;
}

const usePuntos = (campus: string) => {
  const [puntosPorCampus, setPuntosPorCampus] = useState<{ [key: string]: Punto[] }>({
    Talca: [],
    Curico: [],
    Linares: [],
    Colchagua: [],
    Pehuenche: [],
    Santiago: [],
  });

  const [puntoSeleccionado, setPuntoSeleccionado] = useState<Punto | null>(null);
  const [modoAdmin, setModoAdmin] = useState(true);
  const [crearPuntoActivo, setCrearPuntoActivo] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });

  useEffect(() => {
    const cargarPuntos = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/puntos/?campus=${campus}`);
        const data = await response.json();
        setPuntosPorCampus((prevState) => ({
          ...prevState,
          [campus]: data,
        }));
      } catch (error) {
        console.error('Error al cargar los puntos:', error);
      }
    };

    cargarPuntos();
  }, [campus]);

  const handleCrearPunto = async (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!modoAdmin || !crearPuntoActivo) return;

    const svg = svgRef.current!.getBoundingClientRect();
    const x = (e.clientX - svg.left - transform.translateX) / transform.scale;
    const y = (e.clientY - svg.top - transform.translateY) / transform.scale;

    const nuevoPunto = { x, y, info: 'Nuevo Punto', campus };

    try {
      const response = await fetch('http://localhost:8000/api/puntos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoPunto),
      });

      const data = await response.json();

      setPuntosPorCampus((prevState) => ({
        ...prevState,
        [campus]: [...prevState[campus], data],
      }));
    } catch (error) {
      console.error('Error al crear el punto:', error);
    }

    setCrearPuntoActivo(false);
  };

  const handleClickPunto = (punto: Punto, e: React.MouseEvent<SVGCircleElement, MouseEvent>) => {
    e.stopPropagation();
    setPuntoSeleccionado(punto);
  };

  const handleEditarPunto = async (nuevaInfo: string) => {
    if (puntoSeleccionado) {
      const puntoActualizado = { ...puntoSeleccionado, info: nuevaInfo };

      try {
        const response = await fetch(`http://localhost:8000/api/puntos/${puntoSeleccionado.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(puntoActualizado),
        });

        const data = await response.json();

        setPuntosPorCampus((prevState) => ({
          ...prevState,
          [campus]: prevState[campus].map((punto) =>
            punto.id === puntoSeleccionado.id ? data : punto
          ),
        }));
      } catch (error) {
        console.error('Error al actualizar el punto:', error);
      }

      setPuntoSeleccionado(null);
    }
  };

  const handleEliminarPunto = async () => {
    if (puntoSeleccionado) {
      try {
        await fetch(`http://localhost:8000/api/puntos/${puntoSeleccionado.id}/`, {
          method: 'DELETE',
        });

        setPuntosPorCampus((prevState) => ({
          ...prevState,
          [campus]: prevState[campus].filter((punto) => punto.id !== puntoSeleccionado.id),
        }));
      } catch (error) {
        console.error('Error al eliminar el punto:', error);
      }

      setPuntoSeleccionado(null);
    }
  };

  return {
    puntos: puntosPorCampus[campus],
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