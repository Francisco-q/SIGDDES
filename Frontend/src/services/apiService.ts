import { TotemQR, ReceptionQR, Path, PathPoint } from '../types/types';

// Función para obtener tótems
export const fetchTotems = async (campus: string): Promise<TotemQR[]> => {
  const response = await fetch(`http://localhost:8000/api/totems/?campus=${campus}`);
  if (!response.ok) throw new Error('Error al obtener tótems');
  return response.json();
};

// Función para obtener recepciones
export const fetchReceptions = async (campus: string): Promise<ReceptionQR[]> => {
  const response = await fetch(`http://localhost:8000/api/recepciones/?campus=${campus}`);
  if (!response.ok) throw new Error('Error al obtener recepciones');
  return response.json();
};

// Función para obtener caminos
export const fetchPaths = async (campus: string): Promise<Path[]> => {
  const response = await fetch(`http://localhost:8000/api/caminos/?campus=${campus}`);
  if (!response.ok) throw new Error('Error al obtener caminos');
  return response.json();
}; 